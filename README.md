# ChainPilot

**Investigate. Simulate. Approve. Recover.**

An agent-native supply-chain control tower, built for the WebMCP Challenge. ChainPilot lets an AI agent investigate a real supply-chain disruption, simulate recovery strategies against live data, and — only after a human approves — execute the recovery through real WebMCP tools.

```
DETECT → INVESTIGATE → SIMULATE → RECOMMEND → HUMAN APPROVES → EXECUTE → VERIFY
```

**The AI investigates and recommends. The human approves. WebMCP executes.**

---

## Why WebMCP is a strong fit for this use case

A supply-chain disruption isn't one fact, it's a fan-out: one delayed shipment touches inventory across several warehouses, dozens of customer orders, and a real revenue number — and answering "what should we actually do about it" today means a manager manually checking five or six different systems.

That's exactly the shape of problem WebMCP is for. Instead of an agent guessing its way through a dashboard UI — clicking around, screen-scraping numbers, hoping it interpreted a table correctly — ChainPilot exposes the *operations themselves* as typed, structured tools:

```
Agent → looks at the page → guesses which button means what → clicks around → hopes it worked   (without WebMCP)
Agent → calls get_shipment_impact({ shipmentId }) → gets back typed, structured, correct data    (with WebMCP)
```

The site is explicitly telling the agent: here is what you're allowed to do, and here's the exact shape of data you'll get back. That's the whole value proposition — and it's why ChainPilot has 5 deliberate, meaningful tools rather than a wall of thin wrapper functions built to pad a tool count.

## How this creates a better user experience

Before an agent can act, a *human* still has to trust what it found. ChainPilot's UX is built around that trust gap, not around hiding it:

- **Nothing is asserted, everything is shown.** The Agent Activity panel displays every real tool call as it happens — the tool name, its real input, its real output, and how long it actually took. A manager isn't asked to trust an AI's summary; they can see the exact `get_shipment_impact` response it's reasoning from.
- **The numbers are never invented.** `simulate_recovery_plan` runs a fixed, deterministic scoring formula against real order data — the LLM explains the result, it doesn't compute it. Two runs against the same data always produce the same score.
- **A human is structurally required in the loop.** The recommendation is a *proposal*, not an action. Nothing changes in the system — no order status, no shipment reschedule — until a person clicks Approve.

## What people and agents can now do together that was difficult before

Without WebMCP, "let an AI fix this disruption" means either (a) a chatbot that can only describe the problem in prose, useless for actually doing anything, or (b) an agent driving your UI like a user, fragile and unverifiable, and dangerous to trust with a write action.

With WebMCP tools exposing the real operations, a person and an agent can now:
- Have the agent **investigate and simulate multiple recovery strategies in parallel** against live inventory/order data in seconds — something that previously meant a human manually pulling numbers from several systems.
- **Compare options on a shared, inspectable scoring basis** (cost, recovery time, risk, customer impact) instead of the agent's own judgment call.
- Let the agent **execute a multi-step operational change** (update order statuses, reschedule a shipment) as one coordinated action — but only after a person approves it, with the approval boundary enforced by the server, not by the agent's good behavior.

## How we implemented WebMCP

Every tool is registered with the browser via `document.modelContext.registerTool(...)` (feature-detected, since WebMCP is still an emerging API):

```js
document.modelContext.registerTool({
  name: "get_shipment_impact",
  description: "Retrieve a shipment's status plus the inventory and customer-order impact it causes.",
  inputSchema: { type: "object", properties: { shipmentId: { type: "string" } }, required: ["shipmentId"] },
  execute: async ({ shipmentId }) => tools.get_shipment_impact({ shipmentId }),
});
```

See `src/mcp/registerTools.ts` for all 5 registrations and `src/lib/tools.ts` for what each one actually does.

| # | Tool | Type | What it does |
|---|------|------|---------------|
| 1 | `get_shipment_impact` | Read | Real shipment + inventory + order impact, computed from the database |
| 2 | `find_recovery_options` | Read | The recovery strategies available for a shipment |
| 3 | `simulate_recovery_plan` | Read | Deterministic scoring — the credibility centerpiece; never invents numbers |
| 4 | `execute_recovery_plan` | **Write** | Refuses to run unless a human has already approved the plan (checked server-side) |
| 5 | `verify_recovery` | Read | Re-derives before/after from live data to confirm the recovery actually worked |

**Approval is deliberately *not* a WebMCP tool.** It's a plain UI button wired to a normal API call. If "approve" were just another tool available to the agent, nothing would stop it from calling that right after simulating, and the entire human-in-the-loop premise collapses. Keeping approval as an ordinary, human-only action — and having `execute_recovery_plan` check `status === "approved"` server-side — makes that safety boundary real instead of decorative.

---

## Architecture

```
┌───────────────────────────────────────────────────┐
│                  Next.js (App Router)               │
│                                                     │
│  src/mcp/registerTools.ts                           │
│  (document.modelContext) ──── calls ────┐           │
│                                          ▼           │
│  src/app/**/page.tsx           src/app/api/**/route.ts
│  (Dashboard, Disruption Detail,        ▼             │
│   Recovery, etc.)               src/lib/tools.ts     │
│                                          ▼             │
│                                  src/lib/scoring.ts   │
│                                          ▼             │
│                                  src/lib/db.ts         │
│                                  (data/db.json)        │
└───────────────────────────────────────────────────┘
```

One app, one process — frontend pages and the WebMCP tool API routes are both served by Next.js, so there's no separate backend to run or deploy.

- **Frontend**: React + TypeScript + Tailwind, using the Next.js App Router. Registers the 5 tools on load (`src/app/providers.tsx`) and calls them both for the "AI investigates" flow and to render live data on every page.
- **API**: Next.js Route Handlers under `src/app/api/**` expose the 5 tools as `POST /api/tools/*`, plus plain (non-tool) routes for the human approval action and UI table data.
- **Data**: a JSON-file datastore (`src/lib/db.ts`) with the 7-table shape from the spec (suppliers, products, warehouses, inventory, orders, shipments, recovery_plans) — chosen over SQLite/Postgres to avoid native-build risk in a short hackathon window. Auto-seeds on first request. Swapping it out later only touches `db.ts`.
- **Scoring**: `src/lib/scoring.ts` implements the fixed formula `0.30·cost + 0.35·recoveryTime + 0.20·risk + 0.15·customerImpact`, computed per-option from real order data (which orders are protected is derived from actual promised dates vs. the option's recovered ETA, not asserted).

**One known caveat**: the JSON-file datastore persists writes normally on a regular Node server (`next start`, or `next dev` locally), but will **not** persist between requests on a serverless host with a read-only filesystem (e.g. Vercel's default runtime). Deploy on a platform that runs Next.js as a long-lived Node process (Render, Railway, a VM) for the data to behave correctly, or swap `db.ts` for a real hosted database.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
```

That's it — no separate backend process. On first API request, `data/db.json` is auto-created and seeded with the flagship disruption scenario (Shipment #482, Shanghai → Dubai, 5-day delay).

To test with a real WebMCP-capable agent: deploy the app, then open the deployed URL in Chrome with `chrome://flags/#enable-webmcp-testing` enabled, or in ChatGPT's in-app browser.

## License

MIT — see [`LICENSE`](./LICENSE).
