import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAppointments(raw);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Unable to load revenue numbers from backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const totalCompleted = appointments.filter(
    (a) => (a.status || "").toLowerCase() === "completed",
  );
  const totalActive = appointments.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s === "pending" || s === "confirmed" || s === "in_progress";
  });
  const totalCancelled = appointments.filter(
    (a) => (a.status || "").toLowerCase() === "cancelled",
  );

  const grossVolume = totalCompleted.reduce(
    (sum, a) => sum + parseFloat(a.price || a.total_amount || 0),
    0,
  );
  const platformTakeRate = grossVolume * 0.05;
  const averagePrice =
    totalCompleted.length > 0 ? grossVolume / totalCompleted.length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Platform Analytics & Revenue
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Calculated dynamically from real booking transactions in the
              database.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin text-teal-600" : ""}
            />
            <p>Recalculate</p>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gross Completed Volume
            </p>
            <p className="text-3xl font-black text-slate-900">
              {loading ? "..." : formatNaira(grossVolume)}
            </p>
            <p className="text-xs text-slate-500">From finished services</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Platform Commission (5%)
              </p>
              <TrendingUp size={15} className="text-teal-600" />
            </div>
            <p className="text-3xl font-black text-teal-600">
              {loading ? "..." : formatNaira(platformTakeRate)}
            </p>
            <p className="text-xs text-emerald-600 font-bold">
              QueueLess Net Margin
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Finished Sessions
            </p>
            <p className="text-3xl font-black text-slate-900">
              {loading ? "..." : totalCompleted.length}
            </p>
            <p className="text-xs text-slate-500">
              Out of {appointments.length} total orders
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Average Order Value
            </p>
            <p className="text-3xl font-black text-slate-900">
              {loading ? "..." : formatNaira(averagePrice)}
            </p>
            <p className="text-xs text-slate-500">Per client transaction</p>
          </motion.div>
        </div>

        {/* Status Breakdown */}
        <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Booking Lifecycle Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution across all {appointments.length} recorded bookings
              </p>
            </div>
            <img src="/queless.png" alt="QueueLess" className="h-5 w-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <p>Completed</p>
              </div>
              <p className="text-xl font-black text-emerald-700">
                {loading ? "..." : totalCompleted.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-teal-800 font-bold">
                <Clock size={18} className="text-teal-600" />
                <p>Active & Upcoming</p>
              </div>
              <p className="text-xl font-black text-teal-700">
                {loading ? "..." : totalActive.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-800 font-bold">
                <XCircle size={18} className="text-rose-600" />
                <p>Cancelled</p>
              </div>
              <p className="text-xl font-black text-rose-700">
                {loading ? "..." : totalCancelled.length}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
