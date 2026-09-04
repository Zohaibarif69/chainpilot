# ChainPilot

**Investigate. Simulate. Approve. Recover.**

An agent-native supply-chain control tower, built for the WebMCP Challenge. ChainPilot lets an AI agent investigate a real supply-chain disruption, simulate recovery strategies against live data, and — only after a human approves — execute the recovery through real WebMCP tools.

```
DETECT → INVESTIGATE → SIMULATE → RECOMMEND → HUMAN APPROVES → EXECUTE → VERIFY
```

**The AI investigates and recommends. The human approves. WebMCP executes.**

---

## Why WebMCP is a strong fit for this use case

A supply-chain disruption fans out fast: one delayed shipment touches inventory across several warehouses, dozens of customer orders, and a real revenue number — and answering "what should we actually do about it" today means a manager manually checking five or six different systems.

That's exactly the shape of problem WebMCP is for. Instead of an agent guessing its way through a dashboard UI — clicking around, screen-scraping numbers, hoping it interpreted a table correctly — ChainPilot exposes the *operations themselves* as typed, structured tools:

```
Agent → looks at the page → guesses which button means what → clicks around → hopes it worked   (without WebMCP)
Agent → calls get_shipment_impact({ shipmentId }) → gets back typed, structured, correct data    (with WebMCP)
```

The site is explicitly telling the agent: here is what you're allowed to do, and here's the exact shape of data you'll get back. That's the whole value proposition — and it's why ChainPilot has 5 deliberate, meaningful tools rather than a wall of thin wrapper functions built to pad a tool count.

## How this creates a better user experience

Before an agent can act, a *human* still has to trust what it found. ChainPilot's UX is built around that trust gap, not around hiding it:

- **Everything the agent sees, you see too.** The Agent Activity panel displays every real tool call as it happens — the tool name, its real input, its real output, and how long it actually took. A manager sees the exact `get_shipment_impact` response the agent is reasoning from, in full.
- **Every number comes from a fixed formula.** `simulate_recovery_plan` runs a fixed, deterministic scoring formula against real order data — the formula computes the result, the LLM only explains it. Two runs against the same data always produce the same score.
- **A human is structurally required in the loop.** The recommendation is a *proposal*, not an action. Nothing changes in the system — no order status, no shipment reschedule — until a person clicks Approve.

## What people and agents can now do together that was difficult before

Without WebMCP, "let an AI fix this disruption" means either (a) a chatbot that can only describe the problem in prose, useless for actually doing anything, or (b) an agent driving your UI like a user, fragile and unverifiable, and dangerous to trust with a write action.

With WebMCP tools exposing the real operations, a person and an agent can now:
- Have the agent **investigate and simulate multiple recovery strategies in parallel** against live inventory/order data in seconds — something that previously meant a human manually pulling numbers from several systems.
- **Compare options on a shared, inspectable scoring basis** (cost, recovery time, risk, customer impact) instead of the agent's own judgment call.
- Let the agent **execute a multi-step operational change** (update order statuses, reschedule a shipment) as one coordinated action — but only after a person approves it, with the approval boundary enforced by the server, not by the agent's good behavior.
- **Ask direct questions and get a computed answer** — "what's the cheapest option?" or "which is safest?" runs the same real scoring engine live and returns a genuine result, so the tools stay useful outside the fixed investigate → approve flow too.

This generalizes past a single scripted scenario: ChainPilot currently tracks two independent, live disruptions, each with its own shipment, orders, and recovery options, and a person picks which one to work — the same 5 tools handle either.

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
| 3 | `simulate_recovery_plan` | Read | Deterministic scoring — the credibility centerpiece; every number computed by a fixed formula |
| 4 | `execute_recovery_plan` | **Write** | Refuses to run unless a human has already approved the plan (checked server-side) |
| 5 | `verify_recovery` | Read | Re-derives before/after from live data to confirm the recovery actually worked |

**Approval is a plain, human-only UI action, deliberately kept outside the WebMCP tool set.** It's a plain UI button wired to a normal API call. If "approve" were just another tool the agent could call, it could execute right after simulating — collapsing the human-in-the-loop safeguard. Keeping approval as an ordinary, human-only action — and having `execute_recovery_plan` check `status === "approved"` server-side — makes that safety boundary real instead of decorative.

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
- **Scoring**: `src/lib/scoring.ts` implements the fixed formula `0.30·cost + 0.35·recoveryTime + 0.20·risk + 0.15·customerImpact`, computed per-option from real order data (which orders are protected is computed from actual promised dates versus the option's recovered ETA).

**Deployment note**: this JSON-file datastore needs a long-lived Node process to persist writes (Render, Railway, a VM, or `next start` locally) — it won't persist reliably on serverless platforms with a read-only filesystem, like Vercel's default runtime.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
```

That's it — no separate backend process, and no manual seed step. `data/db.json` is created and populated automatically on the first request.

To test with a real WebMCP-capable agent: deploy the app, then open the deployed URL in Chrome with `chrome://flags/#enable-webmcp-testing` enabled, or in ChatGPT's in-app browser.

## License

MIT — see [`LICENSE`](./LICENSE).
