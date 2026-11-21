import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import { CalendarCheck, Search, RefreshCw, AlertCircle } from "lucide-react";

export default function AdminBookings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchBookings = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setList(raw);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Could not query appointments from Django backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const query = search.trim().toLowerCase();
  const filtered = list.filter((b) => {
    const bStatus = (b.status || "").toLowerCase();
    const matchesStatus = statusFilter === "all" || bStatus === statusFilter;
    const serviceName = (b.service_name || b.service?.name || "").toLowerCase();
    const orgName = (
      b.organization_name ||
      b.org ||
      b.organization?.name ||
      ""
    ).toLowerCase();
    const customerName = (
      b.customer_name ||
      b.customer?.full_name ||
      ""
    ).toLowerCase();

    const matchesSearch =
      serviceName.includes(query) ||
      orgName.includes(query) ||
      customerName.includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Platform Bookings Audit
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Live audit trail of appointments across all registered businesses
              ({list.length} total).
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            <p>{refreshing ? "Syncing..." : "Sync Bookings"}</p>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Filter Bar */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by client, service, or business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2 text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              "all",
              "confirmed",
              "pending",
              "in_progress",
              "completed",
              "cancelled",
            ].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-[#102A43] text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-10 w-auto animate-pulse"
              />
              <p className="text-xs text-slate-400">
                Querying live bookings from server...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">ID Ref</th>
                    <th className="py-4 px-6">Customer & Service</th>
                    <th className="py-4 px-6">Business / Specialist</th>
                    <th className="py-4 px-6">Scheduled Time</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => {
                    const st = (b.status || "pending").toLowerCase();
                    const pillClass =
                      st === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : st === "cancelled"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-teal-50 text-teal-700";
                    const dotClass =
                      st === "completed"
                        ? "bg-emerald-500"
                        : st === "cancelled"
                          ? "bg-rose-500"
                          : "bg-teal-500";

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-slate-800 text-xs">
                          #{String(b.id).slice(0, 8)}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900">
                            {b.service_name || b.service?.name || "Service"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {b.customer_name ||
                              b.customer?.full_name ||
                              "Client"}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-700">
                          <p className="font-semibold">
                            {b.organization_name ||
                              b.org ||
                              b.organization?.name ||
                              "Venue"}
                          </p>
                          <p className="text-slate-400">
                            {b.worker_name || b.worker?.full_name || "Assigned"}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {b.time || b.scheduled_time || "Pending"}
                        </td>
                        <td className="py-4 px-6 font-bold text-teal-600">
                          {formatNaira(b.price || b.total_amount || 0)}
                        </td>
                        <td className="py-4 px-6">
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${pillClass}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${dotClass}`}
                            />
                            <p>{b.status || "Active"}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-8 w-auto mx-auto opacity-80"
              />
              <p className="text-slate-400 text-xs">
                No appointments found matching this filter.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
