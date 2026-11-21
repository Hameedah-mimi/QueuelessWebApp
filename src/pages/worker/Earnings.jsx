import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function WorkerEarnings() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAppointments(
        raw.filter((a) => (a.status || "").toLowerCase() === "completed"),
      );
    } catch (err) {
      console.error("Failed to load earnings:", err);
      setError("Could not calculate earnings from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const totalGross = appointments.reduce(
    (sum, a) => sum + parseFloat(a.price || a.service?.price || 0),
    0,
  );
  const netSpecialistShare = totalGross * 0.7;
  const platformFee = totalGross * 0.3;

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Specialist Earnings Ledger
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Calculated dynamically from your completed appointments in the
              database.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchEarnings}
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

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gross Volume Handled
            </p>
            <p className="text-3xl font-black text-slate-900">
              {loading ? "..." : formatNaira(totalGross)}
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <p>From {appointments.length} completed sessions</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Net Take-Home (70%)
            </p>
            <p className="text-3xl font-black text-teal-600">
              {loading ? "..." : formatNaira(netSpecialistShare)}
            </p>
            <p className="text-xs text-emerald-600 font-bold pt-1">
              Direct specialist payout
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-1.5"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Organization Split (30%)
            </p>
            <p className="text-3xl font-black text-slate-900">
              {loading ? "..." : formatNaira(platformFee)}
            </p>
            <p className="text-xs text-slate-500 pt-1">
              Overhead & venue share
            </p>
          </motion.div>
        </div>

        {/* Completed Transactions Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm">
              Completed Transactions Audit
            </h3>
            <img src="/queless.png" alt="QueueLess" className="h-5 w-auto" />
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-10 w-auto animate-pulse"
              />
              <p className="text-xs text-slate-400">
                Calculating earnings ledger...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">ID Ref</th>
                    <th className="py-4 px-6">Service</th>
                    <th className="py-4 px-6">Client</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                        #{String(a.id).slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {a.service_name || a.service?.name || "Service"}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {a.customer_name || a.customer?.full_name || "Client"}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar size={13} className="text-teal-600" />
                          <p>{a.date || "Recorded"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-teal-600">
                        {formatNaira(a.price || a.service?.price || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {appointments.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No completed service transactions found in the database.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
