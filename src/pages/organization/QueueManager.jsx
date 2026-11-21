import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Users,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

export default function OrgQueueManager() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinService, setWalkinService] = useState("");
  const [addingWalkin, setAddingWalkin] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const active = raw
        .filter((item) => {
          const s = (item.status || "").toLowerCase();
          return s !== "completed" && s !== "cancelled";
        })
        .map((item, idx) => ({
          id: item.id,
          ticketNumber: `#${String(idx + 1).padStart(3, "0")}`,
          customer_name:
            item.customer_name || item.customer?.full_name || "Walk-in Client",
          service_name:
            item.service_name || item.service?.name || "General Service",
          worker_name:
            item.worker_name ||
            item.worker?.full_name ||
            "Next Available Specialist",
          status: (item.status || "pending").toLowerCase(),
          time: item.time || item.scheduled_time || "Walk-in",
        }));

      setQueue(active);
    } catch (err) {
      console.error("Queue fetch error:", err);
      setError("Unable to load live queue from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(() => loadQueue(true), 10000);
    return () => clearInterval(timer);
  }, [loadQueue]);

  const handleUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/v1/appointments/${id}/`, { status });
      setQueue((prev) =>
        status === "completed" || status === "cancelled"
          ? prev.filter((q) => q.id !== id)
          : prev.map((q) => (q.id === id ? { ...q, status } : q)),
      );
    } catch (err) {
      console.error("Failed to update status", err);
      loadQueue(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddWalkin = async (e) => {
    e.preventDefault();
    if (!walkinName.trim()) return;

    setAddingWalkin(true);
    setFeedback(null);
    try {
      await api.post("/api/v1/appointments/", {
        customer_name: walkinName.trim(),
        service_name: walkinService.trim() || "Walk-in Service",
        status: "pending",
      });
      setWalkinName("");
      setWalkinService("");
      setFeedback({
        type: "success",
        message: "Walk-in ticket added to the live queue.",
      });
      loadQueue(true);
    } catch (err) {
      console.error("Failed to issue walk-in ticket", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Could not create walk-in ticket. Check backend connection.",
      });
    } finally {
      setAddingWalkin(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Users className="text-teal-600" size={26} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Live Queue Terminal
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Call tickets, start waiting sessions, and issue in-person walk-in
              tickets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadQueue(true)}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            <p>{refreshing ? "Syncing..." : "Sync Queue"}</p>
          </button>
        </div>

        {/* Feedback Banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border p-4 flex items-center justify-between gap-4 text-xs font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 shrink-0"
                  />
                ) : (
                  <XCircle size={18} className="text-rose-600 shrink-0" />
                )}
                <p>{feedback.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => loadQueue()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Active Queue Feed */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Active Waiting Line ({queue.length})
                </h3>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p>Real-time Sync Active</p>
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-10 w-auto animate-pulse"
                  />
                  <p className="text-xs text-slate-400">
                    Loading live queue tickets...
                  </p>
                </div>
              ) : queue.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {queue.map((item, idx) => {
                      const inSession = item.status === "in_progress";

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            inSession
                              ? "border-teal-500 bg-teal-50/35 ring-2 ring-teal-500/15 shadow-sm"
                              : "border-slate-200 bg-white hover:border-teal-300"
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm shrink-0 ${
                                inSession
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 text-slate-900"
                              }`}
                            >
                              <p className="text-[10px] uppercase font-bold opacity-75">
                                Pos
                              </p>
                              <p className="text-sm">
                                {item.ticketNumber ||
                                  `#${String(idx + 1).padStart(3, "0")}`}
                              </p>
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-base truncate">
                                  {item.customer_name}
                                </h4>
                                <div
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    inSession
                                      ? "bg-teal-600 text-white animate-pulse"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  <p>{inSession ? "In Progress" : "Waiting"}</p>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 font-medium truncate">
                                {item.service_name} · Staff:{" "}
                                <strong className="text-slate-800">
                                  {item.worker_name}
                                </strong>
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <Clock size={12} />
                                <p>{item.time}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!inSession ? (
                              <button
                                type="button"
                                disabled={actionLoading === item.id}
                                onClick={() =>
                                  handleUpdate(item.id, "in_progress")
                                }
                                className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <PlayCircle size={15} />
                                Start Session
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading === item.id}
                                onClick={() =>
                                  handleUpdate(item.id, "completed")
                                }
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                              >
                                <CheckCircle2 size={15} />
                                Finish Service
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={actionLoading === item.id}
                              onClick={() => handleUpdate(item.id, "cancelled")}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Cancel ticket"
                              aria-label="Cancel ticket"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-9 w-auto mx-auto opacity-80"
                  />
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    No clients currently in line. Walk-ins and online
                    reservations will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Issue In-Person Walk-In */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  Issue In-Person Walk-In
                </h3>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-5 w-auto"
                />
              </div>

              <form onSubmit={handleAddWalkin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Client Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adebayo Sodiq"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Service Requested
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Haircut, Consultation, Checkup"
                    value={walkinService}
                    onChange={(e) => setWalkinService(e.target.value)}
                    className="input text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingWalkin}
                  className="btn-primary w-full py-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus size={15} />
                  {addingWalkin
                    ? "Issuing Ticket..."
                    : "Issue Ticket into Line"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
