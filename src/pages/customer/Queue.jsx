import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  X,
  XCircle,
} from "lucide-react";

export default function Queue() {
  const [activeTicket, setActiveTicket] = useState(null);
  const [ahead, setAhead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchMyQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const myTicket = raw.find((a) => {
        const s = (a.status || "").toLowerCase();
        return s === "in_progress" || s === "pending";
      });

      if (myTicket) {
        setActiveTicket(myTicket);
        const othersAhead = raw.filter(
          (a) =>
            a.id !== myTicket.id &&
            (a.status || "").toLowerCase() === "pending",
        ).length;
        setAhead(othersAhead);
      } else {
        setActiveTicket(null);
        setAhead(0);
      }
    } catch (err) {
      console.error("Queue sync error:", err);
      setError("Could not connect to live queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQueue();
    const t = setInterval(() => fetchMyQueue(true), 12000);
    return () => clearInterval(t);
  }, [fetchMyQueue]);

  const handleLeaveQueue = async () => {
    if (!activeTicket) return;

    setLeaving(true);
    setFeedback(null);
    try {
      await api.patch(`/api/v1/appointments/${activeTicket.id}/`, {
        status: "cancelled",
      });
      setActiveTicket(null);
      setShowLeaveModal(false);
      setFeedback({
        type: "success",
        message: "You have left the queue and released your spot.",
      });
    } catch (err) {
      console.error("Failed to leave queue:", err);
      setShowLeaveModal(false);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.detail || "Could not cancel your queue ticket.",
      });
    } finally {
      setLeaving(false);
    }
  };

  const inChair = (activeTicket?.status || "").toLowerCase() === "in_progress";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Virtual Queue Terminal
            </h1>
            <p className="text-sm text-slate-500">
              Live line tracking synced directly with your service provider.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchMyQueue(true)}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            <p>{refreshing ? "Syncing..." : "Sync"}</p>
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
              onClick={() => fetchMyQueue()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-12 w-auto animate-pulse"
            />
            <p className="text-xs font-medium text-slate-400">
              Checking live queue tickets...
            </p>
          </div>
        ) : activeTicket ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-xl mx-auto space-y-5"
          >
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Ticket Header Banner */}
              <div className="bg-[#102A43] text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/95 rounded-xl px-2.5 py-1.5">
                    <img
                      src="/queless.png"
                      alt="QueueLess"
                      className="h-5 w-auto"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      Live Digital Pass
                    </p>
                    <p className="text-xs font-bold text-white">
                      {activeTicket.organization_name ||
                        activeTicket.organization?.name ||
                        activeTicket.org ||
                        "Service Venue"}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p>{inChair ? "In Progress" : "In Line"}</p>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-8 text-center space-y-5">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ticket Number
                  </p>
                  <p className="text-6xl font-black text-slate-900 tracking-tight">
                    #{String(activeTicket.id).slice(0, 4)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">
                    {activeTicket.service_name ||
                      activeTicket.service?.name ||
                      "Scheduled Service"}
                  </p>
                  {(activeTicket.date || activeTicket.time) && (
                    <p className="text-xs text-slate-500">
                      {activeTicket.date || activeTicket.scheduled_date}{" "}
                      {activeTicket.time || activeTicket.scheduled_time
                        ? `at ${activeTicket.time || activeTicket.scheduled_time}`
                        : ""}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400">
                      <Users size={14} />
                      <p className="text-[11px] uppercase font-bold tracking-wider">
                        Ahead of You
                      </p>
                    </div>
                    <p className="text-2xl font-black text-slate-900">
                      {ahead}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-teal-700">
                      <Clock size={14} />
                      <p className="text-[11px] uppercase font-bold tracking-wider">
                        Est. Wait
                      </p>
                    </div>
                    <p className="text-2xl font-black text-teal-700">
                      ~{ahead * 15}m
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={leaving}
              onClick={() => setShowLeaveModal(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-sm"
            >
              {leaving ? "Cancelling..." : "Surrender Spot & Leave Queue"}
            </button>
          </motion.div>
        ) : (
          <div className="rounded-3xl p-12 text-center border border-dashed border-slate-200 bg-white space-y-4 shadow-sm">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-10 w-auto mx-auto opacity-80"
            />
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                You are not in any queue
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Book a service or join a virtual queue at any participating
                business to receive a live digital ticket.
              </p>
            </div>
            <Link
              to="/customer/explore"
              className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              Explore Businesses
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </main>

      {/* Leave Queue Confirmation Modal */}
      <AnimatePresence>
        {showLeaveModal && (
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
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-sm">
                    Leave the Queue?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to surrender your current spot in
                    line? You will need to rejoin if you change your mind.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Stay in Line
                </button>
                <button
                  type="button"
                  disabled={leaving}
                  onClick={handleLeaveQueue}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  {leaving ? "Leaving..." : "Yes, Leave Queue"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
