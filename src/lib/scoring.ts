// Deterministic scoring engine — identical logic to the original server/scoring.js.
//
// score = 0.30 * costScore + 0.35 * recoveryTimeScore + 0.20 * riskScore + 0.15 * customerImpactScore
// Weights are fixed on purpose (not user-configurable, keeps the MVP simple and explainable).

const RISK_SCORE: Record<string, number> = { low: 90, medium: 60, high: 30 };
const WEIGHTS = { cost: 0.3, recoveryTime: 0.35, risk: 0.2, customerImpact: 0.15 };

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function costScore(additionalCost: number) {
  return Math.round(clamp(100 - additionalCost / 200));
}

function recoveryTimeScore(recoveryDays: number) {
  return Math.round(clamp(100 - recoveryDays * 15));
}

function riskScore(riskLevel: string) {
  return RISK_SCORE[riskLevel] ?? 50;
}

function customerImpactScore(ordersProtected: number, totalOrders: number) {
  if (totalOrders === 0) return 100;
  return Math.round((ordersProtected / totalOrders) * 100);
}

/**
 * Given an option's fixed facts (cost, recoveryDays, risk) and the REAL current set of
 * affected orders, decide which orders get protected and compute the final score.
 *
 * "Protected" = the order's promisedDate is on/after the shipment's new recovered ETA.
 * This is genuinely computed per-order, not asserted.
 */
export function simulateOption({ option, shipment, affectedOrders }: { option: any; shipment: any; affectedOrders: any[] }) {
  const originalEta = new Date(shipment.originalEta);
  const recoveredEta = new Date(originalEta);
  recoveredEta.setDate(recoveredEta.getDate() + option.recoveryDays);

  const protectedOrders: any[] = [];
  const atRiskOrders: any[] = [];

  for (const order of affectedOrders) {
    const promised = new Date(order.promisedDate);
    if (promised >= recoveredEta) {
      protectedOrders.push(order);
    } else {
      atRiskOrders.push(order);
    }
  }

  const revenueProtected = protectedOrders.reduce((sum, o) => sum + o.revenue, 0);

  const breakdown = {
    cost: costScore(option.additionalCost),
    recoveryTime: recoveryTimeScore(option.recoveryDays),
    risk: riskScore(option.risk),
    customerImpact: customerImpactScore(protectedOrders.length, affectedOrders.length),
  };

  const score = Math.round(
    WEIGHTS.cost * breakdown.cost +
      WEIGHTS.recoveryTime * breakdown.recoveryTime +
      WEIGHTS.risk * breakdown.risk +
      WEIGHTS.customerImpact * breakdown.customerImpact
  );

  return {
    optionId: option.id,
    additionalCost: option.additionalCost,
    recoveryDays: option.recoveryDays,
    riskLevel: option.risk,
    recoveredEta: recoveredEta.toISOString().slice(0, 10),
    ordersProtected: protectedOrders.length,
    ordersStillAtRisk: atRiskOrders.length,
    revenueProtected,
    protectedOrderIds: protectedOrders.map((o) => o.id),
    atRiskOrderIds: atRiskOrders.map((o) => o.id),
    scoreBreakdown: breakdown,
    score,
  };
}
