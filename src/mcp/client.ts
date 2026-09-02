// Thin fetch client for the ChainPilot backend (now Next.js API routes under /api).
// Every WebMCP tool's execute() function, and every page that needs real data,
// goes through here — one place to change error handling, etc.

const API_BASE = "/api";

async function post<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? json?.error ?? `Request to ${path} failed (${res.status})`);
  }
  return json as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? `Request to ${path} failed (${res.status})`);
  }
  return json as T;
}

// ---------------------------------------------------------------------------
// The 5 WebMCP tools. Each function here is the REAL implementation that gets
// wired into document.modelContext.registerTool(...) in mcp/registerTools.ts,
// and is also what the in-app "Investigate with ChainPilot" flow calls directly.
// ---------------------------------------------------------------------------

export type ShipmentImpactResult = {
  shipmentId: string;
  status: string;
  origin: string;
  destination: string;
  originalEta: string;
  newEta: string;
  delayDays: number;
  unitsAtRisk: number;
  affectedWarehouses: number;
  ordersAtRisk: number;
  criticalOrders: number;
  revenueAtRisk: number;
};

export type RecoveryOptionSummary = {
  id: string;
  name: string;
  additionalCost: number;
  recoveryDays: number;
  risk: "low" | "medium" | "high";
  actions: string[];
};

export type SimulationResult = {
  optionId: string;
  planId: string;
  additionalCost: number;
  recoveryDays: number;
  riskLevel: "low" | "medium" | "high";
  recoveredEta: string;
  ordersProtected: number;
  ordersStillAtRisk: number;
  revenueProtected: number;
  protectedOrderIds: string[];
  atRiskOrderIds: string[];
  scoreBreakdown: { cost: number; recoveryTime: number; risk: number; customerImpact: number };
  score: number;
};

export type ExecutionResult =
  | { success: true; planId: string; actions: { type: string; status: string; [k: string]: unknown }[] }
  | { success: false; error: { code: string; message: string } };

export type VerificationResult = {
  planId: string;
  before: { ordersAtRisk: number; revenueAtRisk: number };
  after: { ordersAtRisk: number; revenueAtRisk: number };
  ordersProtected: number;
  revenueProtected: number;
  recoveryConfirmed: boolean;
};

export const tools = {
  get_shipment_impact: (input: { shipmentId: string }) =>
    post<ShipmentImpactResult>("/tools/get_shipment_impact", input),

  find_recovery_options: (input: { shipmentId: string }) =>
    post<{ shipmentId: string; options: RecoveryOptionSummary[] }>("/tools/find_recovery_options", input),

  simulate_recovery_plan: (input: { shipmentId: string; optionId: string }) =>
    post<SimulationResult>("/tools/simulate_recovery_plan", input),

  execute_recovery_plan: (input: { planId: string }) =>
    post<ExecutionResult>("/tools/execute_recovery_plan", input),

  verify_recovery: (input: { planId: string }) =>
    post<VerificationResult>("/tools/verify_recovery", input),
};

// ---------------------------------------------------------------------------
// Plain backend calls — NOT WebMCP tools. Only a human action (the Approve
// button) should ever move a plan into "approved". The agent never calls these.
// ---------------------------------------------------------------------------
export type AffectedOrder = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  priority: "critical" | "high" | "normal";
  promisedDate: string;
  status: string;
  revenue: number;
};

export type AffectedWarehouse = {
  id: string;
  location: string;
  currentInventory: number;
  expectedShortage: number;
  risk: "low" | "medium" | "high";
};

export type ActivityEntry = { id: string; message: string; at: string };

export type RecoveryPlanSummary = {
  id: string;
  shipmentId: string;
  strategy: string;
  additionalCost: number;
  recoveryDays: number;
  riskLevel: "low" | "medium" | "high";
  score: number;
  status: "draft" | "awaiting_approval" | "approved" | "rejected" | "completed";
  createdAt: string;
};

export type DisruptionSummary = {
  shipmentId: string;
  origin: string;
  destination: string;
  status: string;
  delayDays: number;
  ordersAtRisk: number;
  criticalOrders: number;
  revenueAtRisk: number;
};

export type SupplierRow = {
  id: string;
  name: string;
  location: string;
  reliability: number;
  leadTimeDays: number;
  activeOrders: number;
  status: string;
};

export type ShipmentRow = {
  id: string;
  route: string;
  status: string;
  originalEta: string;
  currentEta: string;
  delayDays: number;
  units: number;
  risk: "low" | "medium" | "high";
};

export type OrderRow = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  priority: "critical" | "high" | "normal";
  promisedDate: string;
  status: string;
  revenue: number;
};

export type InventoryRow = {
  warehouse: string;
  product: string;
  available: number;
  reserved: number;
  safetyStock: number;
  status: "critical" | "low" | "healthy";
};

export type AskResult = { answer: string; toolsCalled: string[] };

// Plain data reads for UI tables — not WebMCP tools, just real backend queries.
export const dataApi = {
  getAffectedOrders: (shipmentId: string) =>
    get<{ orders: AffectedOrder[] }>(`/data/orders?shipmentId=${encodeURIComponent(shipmentId)}`).then((r) => r.orders),
  getAffectedWarehouses: (shipmentId: string) =>
    get<{ warehouses: AffectedWarehouse[] }>(`/data/warehouses?shipmentId=${encodeURIComponent(shipmentId)}`).then((r) => r.warehouses),
  getActivity: (limit = 10) =>
    get<{ activity: ActivityEntry[] }>(`/data/activity?limit=${limit}`).then((r) => r.activity),
  getRecoveryPlans: () => get<{ plans: RecoveryPlanSummary[] }>(`/data/recovery-plans`).then((r) => r.plans),
  getDisruptions: () => get<{ disruptions: DisruptionSummary[] }>(`/data/disruptions`).then((r) => r.disruptions),
  getSuppliers: () => get<{ suppliers: SupplierRow[] }>(`/data/suppliers`).then((r) => r.suppliers),
  getAllShipments: () => get<{ shipments: ShipmentRow[] }>(`/data/shipments`).then((r) => r.shipments),
  getAllOrders: () => get<{ orders: OrderRow[] }>(`/data/all-orders`).then((r) => r.orders),
  getInventory: () => get<{ inventory: InventoryRow[] }>(`/data/inventory`).then((r) => r.inventory),
  ask: (shipmentId: string, question: string) => post<AskResult>(`/ask`, { shipmentId, question }),
};

export const approvalApi = {
  propose: (planId: string) => post<{ id: string; status: string }>(`/plans/${planId}/propose`, {}),
  approve: (planId: string) => post<{ id: string; status: string }>(`/plans/${planId}/approve`, {}),
  reject: (planId: string, reason?: string) =>
    post<{ id: string; status: string }>(`/plans/${planId}/reject`, { reason }),
};
