import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import {
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Phone,
  Sparkles,
  Banknote,
  X,
} from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=85";

export default function WorkerDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isAvailable, setIsAvailable] = useState(user?.is_available ?? true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState(null);
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const loadWorkerData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const parsed = raw.map((item) => ({
        id: item.id,
        customer_name:
          item.customer_name || item.customer?.full_name || "Client",
        customer_phone:
          item.customer_phone || item.customer?.phone || item.phone || "",
        service_name:
          item.service_name ||
          item.service?.name ||
          item.service ||
          "Service Session",
        duration: item.duration || item.service?.duration || 45,
        price: parseFloat(
          item.price || item.service?.price || item.total_amount || 0,
        ),
        status: (item.status || "pending").toLowerCase(),
        payment_status:
          item.payment_status ||
          (item.status === "completed" ? "paid" : "due_on_arrival"),
        time:
          item.time || item.scheduled_time || item.start_time || "Scheduled",
        date: item.date || item.scheduled_date || "Today",
      }));

      setAppointments(parsed);
    } catch (err) {
      console.error("Worker appointment fetch error:", err);
      setError("Unable to sync live appointments from Django server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkerData();
    const timer = setInterval(() => loadWorkerData(true), 15000);
    return () => clearInterval(timer);
  }, [loadWorkerData]);

  const performStatusUpdate = async (appointmentId, newStatus) => {
    setActionLoading(appointmentId);
    try {
      await api.patch(`/api/v1/appointments/${appointmentId}/`, {
        status: newStatus,
        payment_status: newStatus === "completed" ? "paid" : "due_on_arrival",
      });
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                status: newStatus,
                payment_status:
                  newStatus === "completed" ? "paid" : "due_on_arrival",
              }
            : apt,
        ),
      );
      setConfirmCompleteId(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      loadWorkerData(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = (appointmentId, newStatus) => {
    if (newStatus === "completed") {
      setConfirmCompleteId(appointmentId);
      return;
    }
    performStatusUpdate(appointmentId, newStatus);
  };

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await api.patch("/api/v1/auth/me/", { is_available: nextState });
    } catch {
      // Retain optimistic switch
    }
  };

  const totalAssigned = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a.status === "completed",
  );
  const completedCount = completedAppointments.length;
  const totalEarned = completedAppointments.reduce(
    (sum, a) => sum + (a.price || 0),
    0,
  );

  const activeQueue = appointments.filter(
    (a) => a.status !== "completed" && a.status !== "cancelled",
  );
  const nextAppointment = appointments.find(
    (a) =>
      a.status === "in_progress" ||
      a.status === "confirmed" ||
      a.status === "pending",
  );

  const displayName =
    user?.full_name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Specialist";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Console Banner */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl bg-[#102A43] text-white shadow-md border border-slate-200/40"
        >
          <img
            src={HERO_IMAGE}
            alt="Specialist workspace"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33]/95 via-[#102A43]/85 to-[#16A6A1]/45" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAvailable
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Specialist Console
                </p>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Hello, {displayName}
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed">
                Live operational view of your assigned clients, queue, and
                completed intake.
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleAvailability}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
                    isAvailable
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30"
                      : "bg-white/10 text-slate-200 border-white/20 hover:bg-white/20"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isAvailable ? "bg-emerald-400" : "bg-slate-400"
                    }`}
                  />
                  <p>
                    {isAvailable ? "Available for Clients" : "Marked On Break"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => loadWorkerData(true)}
                  disabled={refreshing}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-2 backdrop-blur-md border border-white/15 transition"
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "animate-spin text-teal-300" : ""}
                  />
                  <p>{refreshing ? "Syncing..." : "Sync"}</p>
                </button>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center rounded-2xl bg-white/95 px-5 py-4 shadow-md shrink-0">
              <img src="/queless.png" alt="QueueLess" className="h-9 w-auto" />
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* 3 Real KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Clients
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {loading ? "..." : totalAssigned}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Total database records
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Calendar size={22} />
            </div>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Completed Sessions
              </p>
              <p className="text-3xl font-black text-emerald-600 mt-1">
                {loading ? "..." : completedCount}
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                Finished services
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Intake Revenue
              </p>
              <p className="text-3xl font-black text-teal-600 mt-1">
                {loading ? "..." : formatNaira(totalEarned)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Paid at counter</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <div className="rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Active Queue Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clients currently waiting or in session
                  </p>
                </div>
                <div className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                  <p>{activeQueue.length} Active</p>
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-9 w-auto animate-pulse"
                  />
                  <p className="text-xs text-slate-400">
                    Loading live queue...
                  </p>
                </div>
              ) : activeQueue.length > 0 ? (
                <div className="space-y-4">
                  {activeQueue.map((apt) => {
                    const inSession = apt.status === "in_progress";

                    return (
                      <div
                        key={apt.id}
                        className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          inSession
                            ? "border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/15 shadow-sm"
                            : "border-slate-200 bg-white hover:border-teal-300"
                        }`}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                              inSession
                                ? "bg-teal-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {(apt.customer_name || "C")[0].toUpperCase()}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base truncate">
                                {apt.customer_name}
                              </h3>
                              <div
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  inSession
                                    ? "bg-teal-600 text-white animate-pulse"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                <p>{inSession ? "In Progress" : apt.status}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-semibold">
                              <p>{apt.service_name}</p>
                              <p>·</p>
                              <p className="text-teal-600">
                                {formatNaira(apt.price)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock size={13} />
                                <p>
                                  {apt.time} ({apt.duration}m)
                                </p>
                              </div>
                              {apt.customer_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone size={13} />
                                  <p>{apt.customer_phone}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-slate-500">
                                <Banknote size={13} />
                                <p>Pay at venue</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {!inSession ? (
                            <button
                              type="button"
                              disabled={actionLoading === apt.id}
                              onClick={() =>
                                handleUpdateStatus(apt.id, "in_progress")
                              }
                              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white inline-flex items-center gap-1.5 shadow-sm transition"
                            >
                              <PlayCircle size={15} />
                              Start Session
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoading === apt.id}
                              onClick={() =>
                                handleUpdateStatus(apt.id, "completed")
                              }
                              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm transition"
                            >
                              <CheckCircle2 size={15} />
                              Finish Service
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoading === apt.id}
                            onClick={() =>
                              handleUpdateStatus(apt.id, "cancelled")
                            }
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Cancel / No-show"
                            aria-label="Cancel appointment"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No clients currently in your queue
                  </p>
                  <p className="text-xs text-slate-400">
                    New bookings and walk-in assignments will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-3xl p-6 border border-teal-200 bg-gradient-to-br from-white via-white to-teal-50/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-teal-600" />
                  <p>Current Focus</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {nextAppointment ? (
                <div className="space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs text-slate-400 font-semibold uppercase">
                      Time
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {nextAppointment.time}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-sm space-y-1">
                    <p className="text-xs text-teal-700 font-bold uppercase tracking-wider">
                      {nextAppointment.service_name}
                    </p>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {nextAppointment.customer_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Duration: {nextAppointment.duration} mins ·{" "}
                      {formatNaira(nextAppointment.price)}
                    </p>
                  </div>

                  {nextAppointment.status !== "in_progress" ? (
                    <button
                      type="button"
                      disabled={actionLoading === nextAppointment.id}
                      onClick={() =>
                        handleUpdateStatus(nextAppointment.id, "in_progress")
                      }
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <PlayCircle size={15} />
                      Start Session Now
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading === nextAppointment.id}
                      onClick={() =>
                        handleUpdateStatus(nextAppointment.id, "completed")
                      }
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <CheckCircle2 size={15} />
                      Finish Service
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-1">
                  <p className="text-xs font-bold text-slate-700">
                    All caught up
                  </p>
                  <p className="text-xs text-slate-400">
                    No active clients assigned right now.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl p-5 bg-[#102A43] text-white shadow-sm text-xs space-y-2">
              <div className="text-teal-300 font-bold flex items-center gap-1.5">
                <Banknote size={15} />
                <p>Pay-at-Venue Accounting</p>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Verify the customer's POS receipt, transfer, or cash payment
                before tapping <strong>Finish Service</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Complete Payment Confirmation Modal */}
      <AnimatePresence>
        {confirmCompleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-w-md w-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Banknote size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-sm">
                      Confirm Counter Payment
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Confirm that the client has completed payment at the
                      counter or POS terminal before marking this service
                      completed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmCompleteId(null)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmCompleteId(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading === confirmCompleteId}
                  onClick={() =>
                    performStatusUpdate(confirmCompleteId, "completed")
                  }
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  {actionLoading === confirmCompleteId
                    ? "Completing..."
                    : "Confirm & Finish"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
