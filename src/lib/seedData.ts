// Identical seed data to the original server/seed.js — same 7-table shape.
// Used to initialize data/db.json the first time the backend runs.

export function buildSeedDb() {
  return {
    suppliers: [
      { id: "SUP-001", name: "Yangtze Manufacturing", location: "Shanghai, China", reliability: 94, leadTimeDays: 14, activeOrders: 8, status: "active" },
      { id: "SUP-002", name: "Gulf Components Co", location: "Dubai, UAE", reliability: 88, leadTimeDays: 7, activeOrders: 3, status: "active" },
      { id: "SUP-003", name: "AL-SUP-03 Express", location: "Abu Dhabi, UAE", reliability: 76, leadTimeDays: 3, activeOrders: 1, status: "at_risk" },
      { id: "SUP-004", name: "Pacific Parts Ltd", location: "Tokyo, Japan", reliability: 97, leadTimeDays: 21, activeOrders: 5, status: "active" },
      { id: "SUP-005", name: "Euro Supplies GmbH", location: "Hamburg, Germany", reliability: 92, leadTimeDays: 10, activeOrders: 6, status: "active" },
      { id: "SUP-006", name: "APAC Components", location: "Singapore", reliability: 89, leadTimeDays: 12, activeOrders: 4, status: "active" },
    ],

    products: [
      { id: "PRD-001", sku: "A-200", name: "Industrial Components A-200", unitCost: 35 },
      { id: "PRD-002", sku: "B-110", name: "Fasteners B-110", unitCost: 2 },
      { id: "PRD-003", sku: "C-88", name: "Connectors C-88", unitCost: 5 },
    ],

    warehouses: [
      { id: "WH-DXB-01", name: "Dubai Warehouse 1", location: "Dubai, UAE", capacity: 20000 },
      { id: "WH-DXB-02", name: "Dubai Warehouse 2", location: "Dubai, UAE", capacity: 25000 },
      { id: "WH-ABU-01", name: "Abu Dhabi Warehouse 1", location: "Abu Dhabi, UAE", capacity: 15000 },
      { id: "WH-SIN-02", name: "Singapore Warehouse 2", location: "Singapore", capacity: 18000 },
    ],

    inventory: [
      { id: "INV-001", warehouseId: "WH-DXB-01", productId: "PRD-001", quantity: 2100, safetyStock: 500 },
      { id: "INV-002", warehouseId: "WH-DXB-02", productId: "PRD-001", quantity: 3400, safetyStock: 800 },
      { id: "INV-003", warehouseId: "WH-ABU-01", productId: "PRD-001", quantity: 1800, safetyStock: 400 },
      { id: "INV-004", warehouseId: "WH-DXB-01", productId: "PRD-002", quantity: 12000, safetyStock: 2000 },
      { id: "INV-005", warehouseId: "WH-DXB-02", productId: "PRD-002", quantity: 8500, safetyStock: 1500 },
      { id: "INV-006", warehouseId: "WH-SIN-02", productId: "PRD-003", quantity: 4500, safetyStock: 800 },
      { id: "INV-007", warehouseId: "WH-ABU-01", productId: "PRD-002", quantity: 3200, safetyStock: 600 },
    ],

    orders: [
      { id: "ORD-1024", shipmentId: "SHP-482", customer: "Acme Corp", productId: "PRD-001", quantity: 800, priority: "critical", promisedDate: "2026-09-02", revenue: 22000, status: "at_risk" },
      { id: "ORD-1031", shipmentId: "SHP-482", customer: "Meridian Logistics", productId: "PRD-001", quantity: 1200, priority: "critical", promisedDate: "2026-09-02", revenue: 28000, status: "at_risk" },
      { id: "ORD-1019", shipmentId: "SHP-482", customer: "Gulf Trading Co", productId: "PRD-001", quantity: 950, priority: "critical", promisedDate: "2026-09-03", revenue: 20000, status: "at_risk" },
      { id: "ORD-1042", shipmentId: "SHP-482", customer: "Emirates Supply", productId: "PRD-001", quantity: 600, priority: "critical", promisedDate: "2026-09-03", revenue: 8000, status: "at_risk" },
      { id: "ORD-1055", shipmentId: "SHP-482", customer: "Horizon Ventures", productId: "PRD-001", quantity: 400, priority: "critical", promisedDate: "2026-09-04", revenue: 7000, status: "at_risk" },
      { id: "ORD-1067", shipmentId: "SHP-482", customer: "Peak Industries", productId: "PRD-001", quantity: 750, priority: "critical", promisedDate: "2026-09-04", revenue: 9000, status: "at_risk" },
      { id: "ORD-1072", shipmentId: "SHP-482", customer: "Apex Manufacturing", productId: "PRD-001", quantity: 500, priority: "critical", promisedDate: "2026-09-05", revenue: 6000, status: "at_risk" },
      { id: "ORD-1083", shipmentId: "SHP-482", customer: "Dune Distributors", productId: "PRD-001", quantity: 900, priority: "high", promisedDate: "2026-09-05", revenue: 15000, status: "at_risk" },
      { id: "ORD-1091", shipmentId: "SHP-482", customer: "Nordic Trade AS", productId: "PRD-001", quantity: 300, priority: "high", promisedDate: "2026-09-06", revenue: 6000, status: "at_risk" },
      { id: "ORD-1099", shipmentId: "SHP-482", customer: "Sahara Exports", productId: "PRD-001", quantity: 650, priority: "high", promisedDate: "2026-09-06", revenue: 9000, status: "at_risk" },
      { id: "ORD-1104", shipmentId: "SHP-482", customer: "Blue Horizon Ltd", productId: "PRD-001", quantity: 450, priority: "high", promisedDate: "2026-09-07", revenue: 7000, status: "at_risk" },
      { id: "ORD-1112", shipmentId: "SHP-482", customer: "Pacific Rim Co", productId: "PRD-001", quantity: 700, priority: "high", promisedDate: "2026-09-07", revenue: 11000, status: "at_risk" },
      { id: "ORD-1118", shipmentId: "SHP-482", customer: "Crescent Trading", productId: "PRD-001", quantity: 350, priority: "normal", promisedDate: "2026-09-08", revenue: 6000, status: "at_risk" },
      { id: "ORD-1125", shipmentId: "SHP-482", customer: "Vector Supplies", productId: "PRD-001", quantity: 500, priority: "normal", promisedDate: "2026-09-08", revenue: 7000, status: "at_risk" },
      { id: "ORD-1133", shipmentId: "SHP-482", customer: "Atlas Commerce", productId: "PRD-001", quantity: 280, priority: "normal", promisedDate: "2026-09-09", revenue: 5000, status: "at_risk" },
      { id: "ORD-1140", shipmentId: "SHP-482", customer: "Summit Trade", productId: "PRD-001", quantity: 420, priority: "normal", promisedDate: "2026-09-09", revenue: 6000, status: "at_risk" },
      { id: "ORD-1148", shipmentId: "SHP-482", customer: "Oasis Partners", productId: "PRD-001", quantity: 360, priority: "normal", promisedDate: "2026-09-10", revenue: 5000, status: "at_risk" },
      { id: "ORD-1156", shipmentId: "SHP-482", customer: "Zenith Corp", productId: "PRD-001", quantity: 540, priority: "normal", promisedDate: "2026-09-10", revenue: 7000, status: "at_risk" },
      { id: "ORD-2001", shipmentId: "SHP-441", customer: "Riverside Traders", productId: "PRD-002", quantity: 300, priority: "normal", promisedDate: "2026-09-03", revenue: 6000, status: "on_time" },
      { id: "ORD-2002", shipmentId: "SHP-455", customer: "Coastal Supply", productId: "PRD-003", quantity: 220, priority: "high", promisedDate: "2026-09-06", revenue: 5400, status: "on_time" },

      // Second flagship disruption: SHP-463, Mumbai -> Hamburg
      { id: "ORD-4001", shipmentId: "SHP-463", customer: "Mumbai Exports", productId: "PRD-002", quantity: 620, priority: "critical", promisedDate: "2026-09-09", revenue: 10000, status: "at_risk" },
      { id: "ORD-4002", shipmentId: "SHP-463", customer: "Deccan Traders", productId: "PRD-002", quantity: 480, priority: "critical", promisedDate: "2026-09-09", revenue: 8000, status: "at_risk" },
      { id: "ORD-4003", shipmentId: "SHP-463", customer: "Konkan Supply Co", productId: "PRD-002", quantity: 390, priority: "critical", promisedDate: "2026-09-10", revenue: 6000, status: "at_risk" },
      { id: "ORD-4004", shipmentId: "SHP-463", customer: "Rhine Valley Parts", productId: "PRD-002", quantity: 340, priority: "high", promisedDate: "2026-09-11", revenue: 5000, status: "at_risk" },
      { id: "ORD-4005", shipmentId: "SHP-463", customer: "Berlin Industrial", productId: "PRD-002", quantity: 300, priority: "high", promisedDate: "2026-09-12", revenue: 4000, status: "at_risk" },
      { id: "ORD-4006", shipmentId: "SHP-463", customer: "Hanseatic Trading", productId: "PRD-002", quantity: 260, priority: "high", promisedDate: "2026-09-13", revenue: 3000, status: "at_risk" },
      { id: "ORD-4007", shipmentId: "SHP-463", customer: "Nordsee Distributors", productId: "PRD-002", quantity: 220, priority: "normal", promisedDate: "2026-09-14", revenue: 5000, status: "at_risk" },
      { id: "ORD-4008", shipmentId: "SHP-463", customer: "Frankfurt Supply", productId: "PRD-002", quantity: 190, priority: "normal", promisedDate: "2026-09-15", revenue: 5000, status: "at_risk" },
      { id: "ORD-4009", shipmentId: "SHP-463", customer: "Elbe Logistics", productId: "PRD-002", quantity: 170, priority: "normal", promisedDate: "2026-09-16", revenue: 4000, status: "at_risk" },
    ],

    shipments: [
      { id: "SHP-482", origin: "Shanghai", destination: "Dubai", productId: "PRD-001", quantity: 12400, status: "delayed", originalEta: "2026-08-31", currentEta: "2026-09-05", delayDays: 5 },
      { id: "SHP-441", origin: "Rotterdam", destination: "New York", productId: "PRD-002", quantity: 8200, status: "on_time", originalEta: "2026-09-03", currentEta: "2026-09-03", delayDays: 0 },
      { id: "SHP-455", origin: "Tokyo", destination: "Los Angeles", productId: "PRD-003", quantity: 5600, status: "on_time", originalEta: "2026-09-06", currentEta: "2026-09-06", delayDays: 0 },
      { id: "SHP-463", origin: "Mumbai", destination: "Hamburg", productId: "PRD-002", quantity: 3800, status: "at_risk", originalEta: "2026-09-08", currentEta: "2026-09-10", delayDays: 2 },
      { id: "SHP-471", origin: "Singapore", destination: "Antwerp", productId: "PRD-003", quantity: 9100, status: "on_time", originalEta: "2026-09-12", currentEta: "2026-09-12", delayDays: 0 },
      { id: "SHP-478", origin: "Busan", destination: "Sydney", productId: "PRD-001", quantity: 4300, status: "recovered", originalEta: "2026-08-28", currentEta: "2026-08-29", delayDays: 1 },
    ],

    recoveryOptions: [
      {
        id: "ROUTE-A",
        shipmentId: "SHP-482",
        name: "Dubai Express Reroute",
        additionalCost: 8400,
        recoveryDays: 4,
        risk: "low",
        actions: [
          "Reroute Shipment #482 via express carrier",
          "Reserve available inventory at WH-DXB-01",
          "Update expected delivery date",
          "Update affected customer orders",
        ],
      },
      {
        id: "SUPPLIER-B",
        shipmentId: "SHP-482",
        name: "Emergency Supplier",
        additionalCost: 14200,
        recoveryDays: 2,
        risk: "medium",
        actions: [
          "Engage emergency supplier AL-SUP-03",
          "Place expedited purchase order for 12,400 units",
          "Arrange air freight to Dubai warehouses",
          "Update affected customer orders",
        ],
      },
      {
        id: "REALLOC-C",
        shipmentId: "SHP-482",
        name: "Inventory Reallocation",
        additionalCost: 3100,
        recoveryDays: 3,
        risk: "low",
        actions: [
          "Reallocate inventory from WH-ABU-01 to WH-DXB-01",
          "Arrange inter-warehouse transfer logistics",
          "Partially fulfill affected customer orders",
          "Defer lower-priority orders",
        ],
      },

      // Second flagship disruption: SHP-463, Mumbai -> Hamburg
      {
        id: "RAIL-EXPRESS",
        shipmentId: "SHP-463",
        name: "Rail Express via Rotterdam",
        additionalCost: 4200,
        recoveryDays: 3,
        risk: "low",
        actions: [
          "Reroute via rail freight through Rotterdam",
          "Reserve available inventory at WH-DXB-01",
          "Update expected delivery date",
          "Update affected customer orders",
        ],
      },
      {
        id: "SUPPLIER-BERLIN",
        shipmentId: "SHP-463",
        name: "Emergency Supplier — Berlin",
        additionalCost: 11500,
        recoveryDays: 1,
        risk: "medium",
        actions: [
          "Engage emergency supplier in Berlin",
          "Place expedited purchase order",
          "Arrange direct freight to Hamburg",
          "Update affected customer orders",
        ],
      },
      {
        id: "REALLOC-DXB",
        shipmentId: "SHP-463",
        name: "Inventory Reallocation",
        additionalCost: 2800,
        recoveryDays: 2,
        risk: "low",
        actions: [
          "Reallocate inventory from WH-DXB-02 toward Hamburg-bound stock",
          "Arrange inter-warehouse transfer logistics",
          "Partially fulfill affected customer orders",
          "Defer lower-priority orders",
        ],
      },
    ],

    recoveryPlans: [] as any[],

    activityLog: [
      { id: "ACT-1", message: "Shipment SHP-482 marked delayed (+5 days)", at: new Date().toISOString() },
      { id: "ACT-2", message: "Shipment SHP-463 marked at risk (+2 days)", at: new Date().toISOString() },
    ],
  };
}

export type Db = ReturnType<typeof buildSeedDb>;
