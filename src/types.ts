export type ShipmentStatus = "delayed" | "on_time" | "at_risk" | "recovered";
export type RiskLevel = "low" | "medium" | "high";
export type PriorityLevel = "critical" | "high" | "normal";
export type OrderStatus = "at_risk" | "on_time" | "critical" | "recovered" | "protected";

export type ShipmentImpact = {
  shipmentId: string;
  status: ShipmentStatus;
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

export type RecoveryOption = {
  id: string;
  name: string;
  additionalCost: number;
  recoveryDays: number;
  risk: RiskLevel;
  ordersProtected: number;
  ordersStillAtRisk: number;
  revenueProtected: number;
  score: number;
  recommended: boolean;
  scoreBreakdown: {
    cost: number;
    recoveryTime: number;
    risk: number;
    customerImpact: number;
  };
  actions: string[];
  explanation: string;
};

export type RecoverySimulation = {
  optionId: string;
  additionalCost: number;
  recoveryDays: number;
  ordersProtected: number;
  ordersStillAtRisk: number;
  revenueProtected: number;
  riskLevel: RiskLevel;
  score: number;
};

export type RecoveryPlanStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "completed"
  | "rejected"
  | "failed";

export type RecoveryPlan = {
  id: string;
  shipmentId: string;
  optionId: string;
  status: RecoveryPlanStatus;
  additionalCost: number;
  recoveryDays: number;
  ordersProtected: number;
  ordersStillAtRisk: number;
  revenueProtected: number;
  riskLevel: RiskLevel;
  createdAt: string;
  strategy: string;
};

export type AgentToolStatus = "pending" | "running" | "completed" | "failed";

export type AgentToolEvent = {
  id: string;
  tool:
    | "get_shipment_impact"
    | "find_recovery_options"
    | "simulate_recovery_plan"
    | "execute_recovery_plan"
    | "verify_recovery";
  status: AgentToolStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  detail?: string;
};

export type InvestigationState =
  | "idle"
  | "investigating"
  | "investigation_complete"
  | "simulating"
  | "recommendation_ready"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "executed"
  | "verifying"
  | "recovered";

export type Order = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  priority: PriorityLevel;
  promisedDate: string;
  status: OrderStatus;
  revenue: number;
};

export type Warehouse = {
  id: string;
  location: string;
  currentInventory: number;
  expectedShortage: number;
  risk: RiskLevel;
};

export type Shipment = {
  id: string;
  route: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  originalEta: string;
  currentEta: string;
  delayDays: number;
  units: number;
  risk: RiskLevel;
};

export type InventoryItem = {
  warehouse: string;
  product: string;
  available: number;
  reserved: number;
  safetyStock: number;
  status: "healthy" | "low" | "critical";
};

export type Supplier = {
  id: string;
  name: string;
  location: string;
  reliability: number;
  leadTimeDays: number;
  activeOrders: number;
  status: "active" | "at_risk" | "inactive";
};

export type ActivityEvent = {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  type: "ai" | "human" | "system";
  icon?: string;
};

export type VerificationResult = {
  before: {
    ordersAtRisk: number;
    revenueExposure: number;
    delayDays: number;
  };
  after: {
    ordersAtRisk: number;
    revenueExposure: number;
    delayDays: number;
  };
  ordersProtected: number;
  revenueProtected: number;
  delayReduced: number;
  additionalCost: number;
  strategy: string;
};
