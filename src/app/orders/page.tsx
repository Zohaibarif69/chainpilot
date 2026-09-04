"use client";

import { useState, useEffect, useCallback } from "react";
import { useSessionReady } from "@/lib/useSessionReady";
import { Search, AlertTriangle, Loader } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge, priorityVariant, orderStatusVariant } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { formatCurrency, formatNumber } from "@/utils/format";
import { dataApi, type OrderRow } from "@/mcp/client";

type Filter = "All" | "Critical" | "At Risk" | "On Time" | "Recovered";
const filters: Filter[] = ["All", "Critical", "At Risk", "On Time", "Recovered"];

export default function OrdersPage() {
  const sessionReady = useSessionReady();
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setRows(await dataApi.getAllOrders());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    load();
  }, [load, sessionReady]);

  const filtered = rows.filter((o) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Critical" && o.priority === "critical") ||
      (filter === "At Risk" && (o.status === "at_risk" || o.status === "critical")) ||
      (filter === "On Time" && o.status === "on_time") ||
      (filter === "Recovered" && (o.status === "protected" || o.status === "recovered"));
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Orders"
        subtitle="Operations"
        breadcrumbs={[{ label: "Operations" }, { label: "Orders" }]}
      />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  filter === f ? "bg-[#EEF2FF] text-[#3157D5]" : "text-[#667085] hover:bg-[#F1F3F5]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
            <input
              className="pl-9 pr-3 h-8 border border-[#E5E7EB] rounded-lg text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#3157D5] bg-white"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loadError && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#E5E7EB] rounded-xl">
            <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            <p className="text-[13px] text-[#667085] text-center">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {!loadError && !loaded && (
          <div className="flex items-center justify-center gap-2 p-10">
            <Loader className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span className="text-[13px] text-[#667085]">Loading real orders…</span>
          </div>
        )}

        {!loadError && loaded && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                    {["Order", "Customer", "Product", "Quantity", "Priority", "Promised Date", "Status", "Revenue"].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3 font-mono text-[12px] font-medium text-[#3157D5]">{o.id}</td>
                      <td className="px-5 py-3 text-[#111827]">{o.customer}</td>
                      <td className="px-5 py-3 text-[#667085]">{o.product}</td>
                      <td className="px-5 py-3 tabular-nums text-[#667085]">{formatNumber(o.quantity)}</td>
                      <td className="px-5 py-3"><Badge variant={priorityVariant(o.priority)}>{o.priority.toUpperCase()}</Badge></td>
                      <td className="px-5 py-3 text-[#667085]">{o.promisedDate}</td>
                      <td className="px-5 py-3"><Badge variant={orderStatusVariant(o.status as any)}>{o.status.replace("_", " ").toUpperCase()}</Badge></td>
                      <td className="px-5 py-3 tabular-nums font-medium">{formatCurrency(o.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
