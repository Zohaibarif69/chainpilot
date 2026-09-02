// Registers ChainPilot's real WebMCP tools with the browser/agent via
// document.modelContext.registerTool(...). This is the piece that was completely
// missing before Day 2 — previously "WebMCP" only appeared as UI label text.
//
// Feature-detected per the WebMCP spec (it's still an emerging API), so the app
// works fine in browsers/agents that don't support it yet.
//
// NOTE on approval: `execute_recovery_plan` is registered here because an
// external agent DOES need to be able to call it — but the tool itself refuses
// to run unless a human already clicked Approve in the UI (checked server-side
// in server/tools.js). Registering it is not the same as it being unguarded.

import { tools } from "./client";

type ModelContext = {
  registerTool: (def: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: any) => Promise<unknown>;
  }) => void | Promise<void>;
};

function getModelContext(): ModelContext | undefined {
  return (document as any).modelContext ?? (navigator as any).modelContext;
}

let registered = false;

export async function registerChainPilotTools() {
  // Set this FIRST, synchronously, before any await. Next.js dev mode runs React
  // Strict Mode, which deliberately calls effects twice on mount (mount -> cleanup
  // -> mount again) to catch bugs like this. Both calls happen back-to-back before
  // any await below resolves, so if this flag were set at the end of the function
  // instead, the second call would still see `registered === false` and re-run all
  // 5 registrations, causing a real "Duplicate tool name" error from the browser.
  if (registered) return;
  registered = true;

  const mc = getModelContext();
  if (!mc) {
    console.info("[ChainPilot] WebMCP (document.modelContext) not available in this browser/agent — skipping tool registration.");
    return;
  }

  await mc.registerTool({
    name: "get_shipment_impact",
    description: "Retrieve a shipment's status plus the inventory and customer-order impact it causes.",
    inputSchema: {
      type: "object",
      properties: { shipmentId: { type: "string" } },
      required: ["shipmentId"],
    },
    execute: async ({ shipmentId }: { shipmentId: string }) => tools.get_shipment_impact({ shipmentId }),
  });

  await mc.registerTool({
    name: "find_recovery_options",
    description: "Find alternative suppliers and transportation routes that could recover a delayed shipment.",
    inputSchema: {
      type: "object",
      properties: { shipmentId: { type: "string" } },
      required: ["shipmentId"],
    },
    execute: async ({ shipmentId }: { shipmentId: string }) => tools.find_recovery_options({ shipmentId }),
  });

  await mc.registerTool({
    name: "simulate_recovery_plan",
    description:
      "Run a deterministic simulation of a recovery option against current shipment, inventory, and order data. Never invents numbers — cost/time/risk/customer-impact are computed from real order data.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: { type: "string" },
        optionId: { type: "string" },
      },
      required: ["shipmentId", "optionId"],
    },
    execute: async ({ shipmentId, optionId }: { shipmentId: string; optionId: string }) =>
      tools.simulate_recovery_plan({ shipmentId, optionId }),
  });

  await mc.registerTool({
    name: "execute_recovery_plan",
    description:
      "Execute an approved recovery plan: updates order statuses and reschedules the shipment. Refuses to run unless a human has already approved the plan.",
    inputSchema: {
      type: "object",
      properties: { planId: { type: "string" } },
      required: ["planId"],
    },
    execute: async ({ planId }: { planId: string }) => tools.execute_recovery_plan({ planId }),
  });

  await mc.registerTool({
    name: "verify_recovery",
    description: "Re-check shipment, inventory, and order risk after a recovery plan has executed, to confirm the recovery worked.",
    inputSchema: {
      type: "object",
      properties: { planId: { type: "string" } },
      required: ["planId"],
    },
    execute: async ({ planId }: { planId: string }) => tools.verify_recovery({ planId }),
  });

  console.info("[ChainPilot] 5 WebMCP tools registered with document.modelContext.");
}
