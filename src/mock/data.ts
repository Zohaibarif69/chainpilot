import type {
  ShipmentImpact,
  RecoveryOption,
  RecoveryPlan,
  Order,
  Warehouse,
  Shipment,
  InventoryItem,
  Supplier,
  ActivityEvent,
  VerificationResult,
} from "../types";

export const mockShipmentImpact: ShipmentImpact = {
  shipmentId: "SHP-482",
  status: "delayed",
  origin: "Shanghai",
  destination: "Dubai",
  originalEta: "Aug 31",
  newEta: "Sep 5",
  delayDays: 5,
  unitsAtRisk: 12400,
  affectedWarehouses: 3,
  ordersAtRisk: 18,
  criticalOrders: 7,
  revenueAtRisk: 184000,
};

export const mockRecoveryOptions: RecoveryOption[] = [
  {
    id: "ROUTE-A",
    name: "Dubai Express Reroute",
    additionalCost: 8400,
    recoveryDays: 4,
    risk: "low",
    ordersProtected: 16,
    ordersStillAtRisk: 2,
    revenueProtected: 163000,
    score: 81,
    recommended: true,
    scoreBreakdown: { cost: 80, recoveryTime: 85, risk: 90, customerImpact: 82 },
    actions: [
      "Reroute Shipment #482 via express carrier",
      "Reserve available inventory at WH-DXB-01",
      "Update expected delivery date",
      "Update 16 affected customer orders",
    ],
    explanation:
      "Option A protects 16 of 18 affected orders while keeping additional recovery cost at $8,400 and maintaining low operational risk. It provides the strongest overall trade-off between recovery time, cost, risk and customer impact.",
  },
  {
    id: "SUPPLIER-B",
    name: "Emergency Supplier",
    additionalCost: 14200,
    recoveryDays: 2,
    risk: "medium",
    ordersProtected: 17,
    ordersStillAtRisk: 1,
    revenueProtected: 171000,
    score: 68,
    recommended: false,
    scoreBreakdown: { cost: 45, recoveryTime: 95, risk: 60, customerImpact: 90 },
    actions: [
      "Engage emergency supplier AL-SUP-03",
      "Place expedited purchase order for 12,400 units",
      "Arrange air freight to Dubai warehouses",
      "Update affected customer orders",
    ],
    explanation:
      "Option B achieves the fastest recovery time (2 days) and protects 17 orders, but at significantly higher cost ($14,200) and with medium operational risk due to reliance on a new supplier relationship.",
  },
  {
    id: "REALLOC-C",
    name: "Inventory Reallocation",
    additionalCost: 3100,
    recoveryDays: 3,
    risk: "low",
    ordersProtected: 14,
    ordersStillAtRisk: 4,
    revenueProtected: 137000,
    score: 62,
    recommended: false,
    scoreBreakdown: { cost: 95, recoveryTime: 75, risk: 88, customerImpact: 65 },
    actions: [
      "Reallocate inventory from WH-SIN-02 to WH-DXB-01",
      "Arrange inter-warehouse transfer logistics",
      "Partially fulfill 14 customer orders",
      "Defer 4 lower-priority orders",
    ],
    explanation:
      "Option C has the lowest additional cost ($3,100) and low risk, but only protects 14 of 18 orders. Best suited if cost minimization is the primary constraint.",
  },
];

export const mockRecoveryPlan: RecoveryPlan = {
  id: "PLAN-1",
  shipmentId: "SHP-482",
  optionId: "ROUTE-A",
  status: "awaiting_approval",
  additionalCost: 8400,
  recoveryDays: 4,
  ordersProtected: 16,
  ordersStillAtRisk: 2,
  revenueProtected: 163000,
  riskLevel: "low",
  createdAt: "Today, 10:45",
  strategy: "Dubai Express Reroute",
};

export const mockAffectedOrders: Order[] = [
  { id: "ORD-1024", customer: "Acme Corp", product: "Industrial Components", quantity: 800, priority: "critical", promisedDate: "Sep 2", status: "at_risk", revenue: 42000 },
  { id: "ORD-1031", customer: "Meridian Logistics", product: "Industrial Components", quantity: 1200, priority: "critical", promisedDate: "Sep 2", status: "at_risk", revenue: 63000 },
  { id: "ORD-1019", customer: "Gulf Trading Co", product: "Industrial Components", quantity: 950, priority: "critical", promisedDate: "Sep 3", status: "at_risk", revenue: 34200 },
  { id: "ORD-1042", customer: "Emirates Supply", product: "Industrial Components", quantity: 600, priority: "critical", promisedDate: "Sep 3", status: "at_risk", revenue: 18600 },
  { id: "ORD-1055", customer: "Horizon Ventures", product: "Industrial Components", quantity: 400, priority: "critical", promisedDate: "Sep 4", status: "at_risk", revenue: 15200 },
  { id: "ORD-1067", customer: "Peak Industries", product: "Industrial Components", quantity: 750, priority: "critical", promisedDate: "Sep 4", status: "at_risk", revenue: 21000 },
  { id: "ORD-1072", customer: "Apex Manufacturing", product: "Industrial Components", quantity: 500, priority: "critical", promisedDate: "Sep 5", status: "at_risk", revenue: 17500 },
  { id: "ORD-1083", customer: "Dune Distributors", product: "Industrial Components", quantity: 900, priority: "high", promisedDate: "Sep 5", status: "at_risk", revenue: 31500 },
  { id: "ORD-1091", customer: "Nordic Trade AS", product: "Industrial Components", quantity: 300, priority: "high", promisedDate: "Sep 6", status: "at_risk", revenue: 9000 },
  { id: "ORD-1099", customer: "Sahara Exports", product: "Industrial Components", quantity: 650, priority: "high", promisedDate: "Sep 6", status: "at_risk", revenue: 19500 },
  { id: "ORD-1104", customer: "Blue Horizon Ltd", product: "Industrial Components", quantity: 450, priority: "high", promisedDate: "Sep 7", status: "at_risk", revenue: 13500 },
  { id: "ORD-1112", customer: "Pacific Rim Co", product: "Industrial Components", quantity: 700, priority: "high", promisedDate: "Sep 7", status: "at_risk", revenue: 24500 },
  { id: "ORD-1118", customer: "Crescent Trading", product: "Industrial Components", quantity: 350, priority: "normal", promisedDate: "Sep 8", status: "at_risk", revenue: 8750 },
  { id: "ORD-1125", customer: "Vector Supplies", product: "Industrial Components", quantity: 500, priority: "normal", promisedDate: "Sep 8", status: "at_risk", revenue: 12500 },
  { id: "ORD-1133", customer: "Atlas Commerce", product: "Industrial Components", quantity: 280, priority: "normal", promisedDate: "Sep 9", status: "at_risk", revenue: 7000 },
  { id: "ORD-1140", customer: "Summit Trade", product: "Industrial Components", quantity: 420, priority: "normal", promisedDate: "Sep 9", status: "at_risk", revenue: 10500 },
  { id: "ORD-1148", customer: "Oasis Partners", product: "Industrial Components", quantity: 360, priority: "normal", promisedDate: "Sep 10", status: "at_risk", revenue: 9000 },
  { id: "ORD-1156", customer: "Zenith Corp", product: "Industrial Components", quantity: 540, priority: "normal", promisedDate: "Sep 10", status: "at_risk", revenue: 13500 },
];

export const mockAffectedWarehouses: Warehouse[] = [
  { id: "WH-DXB-01", location: "Dubai, UAE", currentInventory: 2100, expectedShortage: -1800, risk: "high" },
  { id: "WH-DXB-02", location: "Dubai, UAE", currentInventory: 3400, expectedShortage: -2600, risk: "high" },
  { id: "WH-ABU-01", location: "Abu Dhabi, UAE", currentInventory: 1800, expectedShortage: -900, risk: "medium" },
];

export const mockShipments: Shipment[] = [
  { id: "SHP-482", route: "Shanghai → Dubai", origin: "Shanghai", destination: "Dubai", status: "delayed", originalEta: "Aug 31", currentEta: "Sep 5", delayDays: 5, units: 12400, risk: "high" },
  { id: "SHP-441", route: "Rotterdam → New York", origin: "Rotterdam", destination: "New York", status: "on_time", originalEta: "Sep 3", currentEta: "Sep 3", delayDays: 0, units: 8200, risk: "low" },
  { id: "SHP-455", route: "Tokyo → Los Angeles", origin: "Tokyo", destination: "Los Angeles", status: "on_time", originalEta: "Sep 6", currentEta: "Sep 6", delayDays: 0, units: 5600, risk: "low" },
  { id: "SHP-463", route: "Mumbai → Hamburg", origin: "Mumbai", destination: "Hamburg", status: "at_risk", originalEta: "Sep 8", currentEta: "Sep 10", delayDays: 2, units: 3800, risk: "medium" },
  { id: "SHP-471", route: "Singapore → Antwerp", origin: "Singapore", destination: "Antwerp", status: "on_time", originalEta: "Sep 12", currentEta: "Sep 12", delayDays: 0, units: 9100, risk: "low" },
  { id: "SHP-478", route: "Busan → Sydney", origin: "Busan", destination: "Sydney", status: "recovered", originalEta: "Aug 28", currentEta: "Aug 29", delayDays: 1, units: 4300, risk: "low" },
];

export const mockInventory: InventoryItem[] = [
  { warehouse: "WH-DXB-01", product: "Industrial Components A-200", available: 2100, reserved: 1800, safetyStock: 500, status: "critical" },
  { warehouse: "WH-DXB-02", product: "Industrial Components A-200", available: 3400, reserved: 2600, safetyStock: 800, status: "critical" },
  { warehouse: "WH-ABU-01", product: "Industrial Components A-200", available: 1800, reserved: 900, safetyStock: 400, status: "low" },
  { warehouse: "WH-DXB-01", product: "Fasteners B-110", available: 12000, reserved: 4000, safetyStock: 2000, status: "healthy" },
  { warehouse: "WH-DXB-02", product: "Fasteners B-110", available: 8500, reserved: 3200, safetyStock: 1500, status: "healthy" },
  { warehouse: "WH-SIN-02", product: "Industrial Components A-200", available: 6200, reserved: 1000, safetyStock: 500, status: "healthy" },
  { warehouse: "WH-SIN-02", product: "Connectors C-88", available: 4500, reserved: 2100, safetyStock: 800, status: "healthy" },
  { warehouse: "WH-ABU-01", product: "Fasteners B-110", available: 3200, reserved: 1800, safetyStock: 600, status: "healthy" },
];

export const mockSuppliers: Supplier[] = [
  { id: "SUP-001", name: "Yangtze Manufacturing", location: "Shanghai, China", reliability: 94, leadTimeDays: 14, activeOrders: 8, status: "active" },
  { id: "SUP-002", name: "Gulf Components Co", location: "Dubai, UAE", reliability: 88, leadTimeDays: 7, activeOrders: 3, status: "active" },
  { id: "SUP-003", name: "AL-SUP-03 Express", location: "Abu Dhabi, UAE", reliability: 76, leadTimeDays: 3, activeOrders: 1, status: "at_risk" },
  { id: "SUP-004", name: "Pacific Parts Ltd", location: "Tokyo, Japan", reliability: 97, leadTimeDays: 21, activeOrders: 5, status: "active" },
  { id: "SUP-005", name: "Euro Supplies GmbH", location: "Hamburg, Germany", reliability: 92, leadTimeDays: 10, activeOrders: 6, status: "active" },
  { id: "SUP-006", name: "APAC Components", location: "Singapore", reliability: 89, leadTimeDays: 12, activeOrders: 4, status: "active" },
];

export const mockActivityEvents: ActivityEvent[] = [
  { id: "ACT-010", timestamp: "10:45", title: "Recovery Plan #1 verified", description: "16 of 18 orders confirmed protected. Revenue exposure reduced from $184K to $21K.", type: "ai" },
  { id: "ACT-009", timestamp: "10:43", title: "Recovery Plan #1 executed", description: "All four recovery actions completed successfully.", type: "system" },
  { id: "ACT-008", timestamp: "10:42", title: "Human approved Recovery Plan #1", description: "Operations manager approved Dubai Express Reroute strategy.", type: "human" },
  { id: "ACT-007", timestamp: "10:41", title: "ChainPilot recommendation generated", description: "Option A (Dubai Express Reroute) recommended with score 81/100.", type: "ai" },
  { id: "ACT-006", timestamp: "10:40", title: "Recovery strategies simulated", description: "3 recovery options simulated and scored.", type: "ai" },
  { id: "ACT-005", timestamp: "10:39", title: "3 recovery options identified", description: "ChainPilot found Dubai Express Reroute, Emergency Supplier, and Inventory Reallocation.", type: "ai" },
  { id: "ACT-004", timestamp: "10:44", title: "Impact analysis started", description: "ChainPilot began analyzing operational impact of SHP-482 delay.", type: "ai" },
  { id: "ACT-003", timestamp: "10:43", title: "Shipment #482 marked delayed", description: "System detected 5-day delay on Shanghai → Dubai route.", type: "system" },
  { id: "ACT-002", timestamp: "10:38", title: "ChainPilot agent activated", description: "Supply chain monitoring agent started investigation.", type: "ai" },
  { id: "ACT-001", timestamp: "10:35", title: "Disruption alert received", description: "Carrier reported weather delays affecting Shanghai port operations.", type: "system" },
];

export const mockVerificationResult: VerificationResult = {
  before: {
    ordersAtRisk: 18,
    revenueExposure: 184000,
    delayDays: 5,
  },
  after: {
    ordersAtRisk: 2,
    revenueExposure: 21000,
    delayDays: 1,
  },
  ordersProtected: 16,
  revenueProtected: 163000,
  delayReduced: 4,
  additionalCost: 8400,
  strategy: "Dubai Express Reroute",
};

export const mockRecoveryPlans: RecoveryPlan[] = [
  mockRecoveryPlan,
  {
    id: "PLAN-2",
    shipmentId: "SHP-441",
    optionId: "REALLOC-C",
    status: "completed",
    additionalCost: 2100,
    recoveryDays: 2,
    ordersProtected: 6,
    ordersStillAtRisk: 0,
    revenueProtected: 45000,
    riskLevel: "low",
    createdAt: "Aug 28, 09:15",
    strategy: "Inventory Reallocation",
  },
  {
    id: "PLAN-3",
    shipmentId: "SHP-463",
    optionId: "SUPPLIER-B",
    status: "draft",
    additionalCost: 5600,
    recoveryDays: 2,
    ordersProtected: 4,
    ordersStillAtRisk: 1,
    revenueProtected: 28000,
    riskLevel: "medium",
    createdAt: "Today, 09:30",
    strategy: "Emergency Supplier",
  },
];
