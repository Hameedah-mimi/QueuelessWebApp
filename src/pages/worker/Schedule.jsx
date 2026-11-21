import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Phone,
  AlertCircle,
} from "lucide-react";

export default function WorkerSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAppointments(raw);
    } catch (err) {
      console.error("Failed to load schedule:", err);
      setError("Could not retrieve schedule from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const query = search.trim().toLowerCase();
  const filtered = appointments.filter((item) => {
    const st = (item.status || "pending").toLowerCase();
    const matchesTab =
      tab === "upcoming"
        ? st !== "completed" && st !== "cancelled"
        : tab === "completed"
          ? st === "completed"
          : st === "cancelled";

    const customer = (
      item.customer_name ||
      item.customer?.full_name ||
      ""
    ).toLowerCase();
    const service = (
      item.service_name ||
      item.service?.name ||
      ""
    ).toLowerCase();
    const matchesSearch = customer.includes(query) || service.includes(query);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Calendar className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                My Appointment Schedule
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Complete calendar of clients booked specifically with you.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSchedule}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin text-teal-600" : ""}
            />
            <p>Refresh</p>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Search & Tabs */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by customer name or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2 text-sm w-full"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["upcoming", "completed", "cancelled"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${
                  tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule List */}
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
                Loading schedule records...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Service</th>
                    <th className="py-4 px-6">Date & Slot</th>
                    <th className="py-4 px-6">Fee</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const st = (item.status || "pending").toLowerCase();
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
                        key={item.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900">
                            {item.customer_name ||
                              item.customer?.full_name ||
                              "Client"}
                          </p>
                          {item.customer_phone && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={12} />
                              <p>{item.customer_phone}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {item.service_name || item.service?.name || "Service"}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          <div className="inline-flex items-center gap-1.5">
                            <Clock size={13} className="text-teal-600" />
                            <p>
                              {item.date || item.scheduled_date || "Today"} ·{" "}
                              {item.time || item.scheduled_time || "Pending"}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-teal-600">
                          {formatNaira(item.price || item.service?.price || 0)}
                        </td>
                        <td className="py-4 px-6">
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${pillClass}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${dotClass}`}
                            />
                            <p>{item.status || "Active"}</p>
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
                No appointments found under "{tab}".
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
