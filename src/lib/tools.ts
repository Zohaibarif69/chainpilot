// The real logic behind ChainPilot's 5 WebMCP tools — identical to the original
// server/tools.js. Wired up behind Next.js API routes (src/app/api/**) instead
// of Express routes. Nothing here is hardcoded per-scenario — it all reads/writes
// the JSON "database".
//
// Every exported function now accepts a `sessionId` string so that each visitor
// operates on their own isolated copy of the database.

import { loadDb, saveDb } from "./db";
import { simulateOption } from "./scoring";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function notFound(entity: string, id: string) {
  return new ApiError("NOT_FOUND", `${entity} not found: ${id}`);
}

function getAffectedOrders(db: any, shipmentId: string) {
  return db.orders.filter((o: any) => o.shipmentId === shipmentId);
}

function logActivity(db: any, message: string) {
  db.activityLog = db.activityLog ?? [];
  db.activityLog.push({ id: `ACT-${db.activityLog.length + 1}`, message, at: new Date().toISOString() });
  if (db.activityLog.length > 30) db.activityLog = db.activityLog.slice(-30);
}

export async function getActivity(sessionId: string, { limit = 10 }: { limit?: number } = {}) {
  const db = await loadDb(sessionId);
  const log = db.activityLog ?? [];
  return [...log].sort((a: any, b: any) => +new Date(b.at) - +new Date(a.at)).slice(0, limit);
}

function currentExposure(db: any, shipmentId: string) {
  const orders = getAffectedOrders(db, shipmentId).filter(
    (o: any) => o.status === "at_risk" || o.status === "critical"
  );
  return {
    ordersAtRisk: orders.length,
    revenueAtRisk: orders.reduce((sum: number, o: any) => sum + o.revenue, 0),
  };
}

// ---------------------------------------------------------------------------
// Plain data endpoints (NOT WebMCP tools) — used by the UI to render the
// Affected Orders / Affected Warehouses tables with real, live data.
// ---------------------------------------------------------------------------
export async function listAffectedOrders(sessionId: string, { shipmentId }: { shipmentId: string }) {
  const db = await loadDb(sessionId);
  const product = db.products;
  return getAffectedOrders(db, shipmentId)
    .map((o: any) => ({
      id: o.id,
      customer: o.customer,
      product: product.find((p: any) => p.id === o.productId)?.name ?? o.productId,
      quantity: o.quantity,
      priority: o.priority,
      promisedDate: o.promisedDate,
      status: o.status,
      revenue: o.revenue,
    }))
    .sort((a: any, b: any) => +new Date(a.promisedDate) - +new Date(b.promisedDate));
}

export async function listAffectedWarehouses(sessionId: string, { shipmentId }: { shipmentId: string }) {
  const db = await loadDb(sessionId);
  const shipment = db.shipments.find((s: any) => s.id === shipmentId);
  if (!shipment) throw notFound("Shipment", shipmentId);

  return db.inventory
    .filter((inv: any) => inv.productId === shipment.productId)
    .map((inv: any) => {
      const wh = db.warehouses.find((w: any) => w.id === inv.warehouseId);
      const shortage = inv.quantity - inv.safetyStock - shipment.quantity / 3;
      const risk = shortage < -1500 ? "high" : shortage < 0 ? "medium" : "low";
      return {
        id: inv.warehouseId,
        location: wh?.location ?? inv.warehouseId,
        currentInventory: inv.quantity,
        expectedShortage: Math.round(shortage),
        risk,
      };
    });
}

export async function listRecoveryPlans(sessionId: string) {
  const db = await loadDb(sessionId);
  return [...db.recoveryPlans]
    .sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((p: any) => ({
      id: p.id,
      shipmentId: p.shipmentId,
      strategy: p.strategy,
      additionalCost: p.simulation.additionalCost,
      recoveryDays: p.simulation.recoveryDays,
      riskLevel: p.simulation.riskLevel,
      score: p.simulation.score,
      status: p.status,
      createdAt: p.createdAt,
    }));
}

export async function listDisruptions(sessionId: string) {
  const db = await loadDb(sessionId);
  return db.shipments
    .filter((s: any) => s.status !== "on_time")
    .map((s: any) => {
      const exposure = currentExposure(db, s.id);
      const affectedOrders = getAffectedOrders(db, s.id);
      const criticalOrders = affectedOrders.filter((o: any) => o.priority === "critical").length;
      return {
        shipmentId: s.id,
        origin: s.origin,
        destination: s.destination,
        status: s.status,
        delayDays: s.delayDays,
        ordersAtRisk: exposure.ordersAtRisk,
        criticalOrders,
        revenueAtRisk: exposure.revenueAtRisk,
      };
    })
    .sort((a: any, b: any) => b.revenueAtRisk - a.revenueAtRisk);
}

export async function listAllSuppliers(sessionId: string) {
  const db = await loadDb(sessionId);
  return db.suppliers;
}

export async function listAllShipments(sessionId: string) {
  const db = await loadDb(sessionId);
  return db.shipments.map((s: any) => {
    const risk =
      s.status === "delayed" || s.status === "at_risk"
        ? s.delayDays > 3
          ? "high"
          : s.delayDays > 0
            ? "medium"
            : "low"
        : "low";
    return {
      id: s.id,
      route: `${s.origin} → ${s.destination}`,
      status: s.status,
      originalEta: s.originalEta,
      currentEta: s.currentEta,
      delayDays: s.delayDays,
      units: s.quantity,
      risk,
    };
  });
}

export async function listAllOrders(sessionId: string) {
  const db = await loadDb(sessionId);
  return db.orders
    .map((o: any) => ({
      id: o.id,
      customer: o.customer,
      product: db.products.find((p: any) => p.id === o.productId)?.name ?? o.productId,
      quantity: o.quantity,
      priority: o.priority,
      promisedDate: o.promisedDate,
      status: o.status,
      revenue: o.revenue,
    }))
    .sort((a: any, b: any) => +new Date(a.promisedDate) - +new Date(b.promisedDate));
}

export async function listAllInventory(sessionId: string) {
  const db = await loadDb(sessionId);
  return db.inventory.map((inv: any) => {
    const wh = db.warehouses.find((w: any) => w.id === inv.warehouseId);
    const product = db.products.find((p: any) => p.id === inv.productId);
    const status = inv.quantity < inv.safetyStock ? "critical" : inv.quantity < inv.safetyStock * 1.5 ? "low" : "healthy";
    return {
      warehouse: wh?.name ?? inv.warehouseId,
      product: product?.name ?? inv.productId,
      available: inv.quantity,
      reserved: 0,
      safetyStock: inv.safetyStock,
      status,
    };
  });
}

export async function askQuestion(sessionId: string, { shipmentId, question }: { shipmentId: string; question: string }) {
  const db = await loadDb(sessionId);
  const shipment = db.shipments.find((s: any) => s.id === shipmentId);
  if (!shipment) throw notFound("Shipment", shipmentId);

  const options = db.recoveryOptions.filter((o: any) => o.shipmentId === shipmentId);
  const affectedOrders = getAffectedOrders(db, shipmentId);
  const q = question.toLowerCase();

  let answer: string;
  let toolsCalled: string[] = [];

  if (options.length === 0) {
    return { answer: "No recovery options are available for this shipment yet.", toolsCalled: ["find_recovery_options"] };
  }

  if (/cheap|budget|least expensive|lowest cost/.test(q)) {
    const cheapest = [...options].sort((a: any, b: any) => a.additionalCost - b.additionalCost)[0];
    const sim = simulateOption({ option: cheapest, shipment, affectedOrders });
    toolsCalled = ["find_recovery_options", "simulate_recovery_plan"];
    answer = `The cheapest option is "${cheapest.name}" at $${cheapest.additionalCost.toLocaleString()}. Simulated: protects ${sim.ordersProtected} of ${sim.ordersProtected + sim.ordersStillAtRisk} orders, ${cheapest.recoveryDays}-day recovery, score ${sim.score}/100.`;
  } else if (/fast|quick|speed|soonest/.test(q)) {
    const fastest = [...options].sort((a: any, b: any) => a.recoveryDays - b.recoveryDays)[0];
    const sim = simulateOption({ option: fastest, shipment, affectedOrders });
    toolsCalled = ["find_recovery_options", "simulate_recovery_plan"];
    answer = `The fastest option is "${fastest.name}" — ${fastest.recoveryDays}-day recovery. Simulated: protects ${sim.ordersProtected} orders, costs $${fastest.additionalCost.toLocaleString()}, score ${sim.score}/100.`;
  } else if (/safe|low risk|least risk/.test(q)) {
    const lowRisk = options.filter((o: any) => o.risk === "low");
    toolsCalled = ["find_recovery_options", "simulate_recovery_plan"];
    if (lowRisk.length === 0) {
      answer = `None of the ${options.length} options for this shipment are rated low risk.`;
    } else {
      const scored = lowRisk
        .map((o: any) => ({ o, sim: simulateOption({ option: o, shipment, affectedOrders }) }))
        .sort((a: any, b: any) => b.sim.score - a.sim.score);
      const best = scored[0];
      answer = `The safest (low-risk) option is "${best.o.name}" — score ${best.sim.score}/100, protects ${best.sim.ordersProtected} orders, costs $${best.o.additionalCost.toLocaleString()}.`;
    }
  } else if (/critical/.test(q)) {
    const critical = affectedOrders.filter((o: any) => o.priority === "critical").length;
    toolsCalled = ["get_shipment_impact"];
    answer = `${critical} of the ${affectedOrders.length} affected orders are marked critical priority.`;
  } else if (/revenue|exposure|money|dollar/.test(q)) {
    const exposure = currentExposure(db, shipmentId);
    toolsCalled = ["get_shipment_impact"];
    answer = `Current revenue exposure is $${exposure.revenueAtRisk.toLocaleString()} across ${exposure.ordersAtRisk} orders still at risk.`;
  } else if (/best|recommend|top|winner/.test(q)) {
    const scored = options.map((o: any) => ({ o, sim: simulateOption({ option: o, shipment, affectedOrders }) }));
    toolsCalled = ["find_recovery_options", "simulate_recovery_plan"];
    const best = scored.reduce((a: any, b: any) => (b.sim.score > a.sim.score ? b : a));
    answer = `The recommended option is "${best.o.name}", scoring ${best.sim.score}/100 — protects ${best.sim.ordersProtected} orders at a cost of $${best.o.additionalCost.toLocaleString()}.`;
  } else {
    answer = `I can answer real questions about this disruption's recovery options — try asking about the cheapest, fastest, safest, or best option, or about critical orders and revenue exposure.`;
    toolsCalled = [];
  }

  return { answer, toolsCalled };
}

// ---------------------------------------------------------------------------
// 1. get_shipment_impact
// ---------------------------------------------------------------------------
export async function getShipmentImpact(sessionId: string, { shipmentId }: { shipmentId: string }) {
  const db = await loadDb(sessionId);
  const shipment = db.shipments.find((s: any) => s.id === shipmentId);
  if (!shipment) throw notFound("Shipment", shipmentId);

  const affectedOrders = getAffectedOrders(db, shipmentId);
  const criticalOrders = affectedOrders.filter((o: any) => o.priority === "critical");
  const exposure = currentExposure(db, shipmentId);

  const affectedWarehouseIds = [
    ...new Set(
      db.inventory
        .filter((inv: any) => inv.productId === shipment.productId)
        .map((inv: any) => inv.warehouseId)
    ),
  ];

  return {
    shipmentId: shipment.id,
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    originalEta: shipment.originalEta,
    newEta: shipment.currentEta,
    delayDays: shipment.delayDays,
    unitsAtRisk: shipment.quantity,
    affectedWarehouses: affectedWarehouseIds.length,
    ordersAtRisk: exposure.ordersAtRisk,
    criticalOrders: criticalOrders.length,
    revenueAtRisk: exposure.revenueAtRisk,
  };
}

// ---------------------------------------------------------------------------
// 2. find_recovery_options
// ---------------------------------------------------------------------------
export async function findRecoveryOptions(sessionId: string, { shipmentId }: { shipmentId: string }) {
  const db = await loadDb(sessionId);
  const shipment = db.shipments.find((s: any) => s.id === shipmentId);
  if (!shipment) throw notFound("Shipment", shipmentId);

  const options = db.recoveryOptions.filter((o: any) => o.shipmentId === shipmentId);

  const alreadyLogged = (db.activityLog ?? []).some(
    (a: any) => a.message.includes("recovery options identified") && a.message.includes(`for ${shipmentId}`)
  );
  if (!alreadyLogged) {
    logActivity(db, `${options.length} recovery options identified for ${shipmentId}`);
    await saveDb(sessionId, db);
  }

  return {
    shipmentId,
    options: options.map((o: any) => ({
      id: o.id,
      name: o.name,
      additionalCost: o.additionalCost,
      recoveryDays: o.recoveryDays,
      risk: o.risk,
      actions: o.actions,
    })),
  };
}

// ---------------------------------------------------------------------------
// 3. simulate_recovery_plan
// ---------------------------------------------------------------------------
export async function simulateRecoveryPlan(sessionId: string, { shipmentId, optionId }: { shipmentId: string; optionId: string }) {
  const db = await loadDb(sessionId);
  const shipment = db.shipments.find((s: any) => s.id === shipmentId);
  if (!shipment) throw notFound("Shipment", shipmentId);

  const option = db.recoveryOptions.find((o: any) => o.id === optionId && o.shipmentId === shipmentId);
  if (!option) throw notFound("Recovery option", optionId);

  const affectedOrders = getAffectedOrders(db, shipmentId);
  const result = simulateOption({ option, shipment, affectedOrders });

  let plan = db.recoveryPlans.find(
    (p: any) => p.shipmentId === shipmentId && p.optionId === optionId && p.status === "draft"
  );
  const before = currentExposure(db, shipmentId);

  if (!plan) {
    plan = {
      id: `PLAN-${db.recoveryPlans.length + 1}`,
      shipmentId,
      optionId,
      status: "draft",
      strategy: option.name,
      simulation: result,
      before,
      after: null,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      executedAt: null,
    };
    db.recoveryPlans.push(plan);
    logActivity(db, `Simulated "${option.name}" — score ${result.score}/100, ${result.ordersProtected} orders protected`);
  } else {
    plan.simulation = result;
    plan.before = before;
  }
  await saveDb(sessionId, db);

  return { ...result, planId: plan.id };
}

// ---------------------------------------------------------------------------
// Plain backend calls (NOT WebMCP tools)
// ---------------------------------------------------------------------------
export async function proposePlan(sessionId: string, { planId }: { planId: string }) {
  const db = await loadDb(sessionId);
  const plan = db.recoveryPlans.find((p: any) => p.id === planId);
  if (!plan) throw notFound("Recovery plan", planId);
  plan.status = "awaiting_approval";
  await saveDb(sessionId, db);
  return plan;
}

export async function approvePlan(sessionId: string, { planId }: { planId: string }) {
  const db = await loadDb(sessionId);
  const plan = db.recoveryPlans.find((p: any) => p.id === planId);
  if (!plan) throw notFound("Recovery plan", planId);
  plan.status = "approved";
  plan.approvedAt = new Date().toISOString();
  logActivity(db, `Human approved recovery plan ${planId} (${plan.strategy})`);
  await saveDb(sessionId, db);
  return plan;
}

export async function rejectPlan(sessionId: string, { planId, reason }: { planId: string; reason?: string }) {
  const db = await loadDb(sessionId);
  const plan = db.recoveryPlans.find((p: any) => p.id === planId);
  if (!plan) throw notFound("Recovery plan", planId);
  plan.status = "rejected";
  plan.rejectionReason = reason ?? null;
  logActivity(db, `Human rejected recovery plan ${planId}${reason ? ` — ${reason}` : ""}`);
  await saveDb(sessionId, db);
  return plan;
}

// ---------------------------------------------------------------------------
// 4. execute_recovery_plan
// ---------------------------------------------------------------------------
export async function executeRecoveryPlan(sessionId: string, { planId }: { planId: string }) {
  const db = await loadDb(sessionId);
  const plan = db.recoveryPlans.find((p: any) => p.id === planId);
  if (!plan) throw notFound("Recovery plan", planId);

  if (plan.status !== "approved") {
    return {
      success: false,
      error: {
        code: "NOT_APPROVED",
        message: `Plan ${planId} has not been approved by a human yet (status: ${plan.status}).`,
      },
    };
  }

  const shipment = db.shipments.find((s: any) => s.id === plan.shipmentId)!;
  const { protectedOrderIds, atRiskOrderIds } = plan.simulation;

  for (const order of db.orders) {
    if (protectedOrderIds.includes(order.id)) order.status = "protected";
    if (atRiskOrderIds.includes(order.id)) order.status = "critical";
  }

  shipment.delayDays = plan.simulation.recoveryDays;
  shipment.currentEta = plan.simulation.recoveredEta;
  shipment.status = atRiskOrderIds.length === 0 ? "recovered" : "at_risk";

  plan.status = "completed";
  plan.executedAt = new Date().toISOString();
  logActivity(db, `Recovery plan ${planId} executed — shipment rescheduled to ${shipment.currentEta}`);

  await saveDb(sessionId, db);

  return {
    success: true,
    planId: plan.id,
    actions: [
      { type: "order_status_update", status: "completed", count: protectedOrderIds.length + atRiskOrderIds.length },
      { type: "shipment_reschedule", status: "completed", newEta: shipment.currentEta },
    ],
  };
}

// ---------------------------------------------------------------------------
// 5. verify_recovery
// ---------------------------------------------------------------------------
export async function verifyRecovery(sessionId: string, { planId }: { planId: string }) {
  const db = await loadDb(sessionId);
  const plan = db.recoveryPlans.find((p: any) => p.id === planId);
  if (!plan) throw notFound("Recovery plan", planId);

  const after = currentExposure(db, plan.shipmentId);
  plan.after = after;

  const recoveryConfirmed = after.ordersAtRisk < plan.before.ordersAtRisk;
  logActivity(
    db,
    recoveryConfirmed
      ? `Recovery plan ${planId} verified — orders at risk ${plan.before.ordersAtRisk} → ${after.ordersAtRisk}`
      : `Recovery plan ${planId} verified — no improvement detected`
  );
  await saveDb(sessionId, db);

  return {
    planId: plan.id,
    before: plan.before,
    after,
    ordersProtected: plan.before.ordersAtRisk - after.ordersAtRisk,
    revenueProtected: plan.before.revenueAtRisk - after.revenueAtRisk,
    recoveryConfirmed,
  };
}
