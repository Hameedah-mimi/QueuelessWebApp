import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Banknote,
  X,
  Phone,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=85";

function normalizeTimeForInput(rawTime) {
  if (!rawTime) return "";
  const str = String(rawTime).trim();
  // Already HH:mm or HH:mm:ss
  const twentyFourMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourMatch) {
    return `${twentyFourMatch[1].padStart(2, "0")}:${twentyFourMatch[2]}`;
  }
  // Handle 12-hour format like "10:00 AM" / "2:30 PM"
  const twelveHourMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const mins = twelveHourMatch[2];
    const period = twelveHourMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${mins}`;
  }
  return "";
}

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [apt, setApt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/v1/appointments/${id}/`);
      const d = res.data;
      const rawDate = d.date || d.scheduled_date || "";
      const rawTime = d.time || d.scheduled_time || "";

      setApt({
        id: d.id,
        service:
          d.service_name ||
          d.service?.name ||
          d.service ||
          "Specialized Service",
        org:
          d.organization_name ||
          d.organization?.name ||
          d.org ||
          "Service Center",
        orgId: d.organization?.id || d.organization_id || d.org_id || null,
        worker: d.worker_name || d.worker?.full_name || "Assigned Specialist",
        workerId: d.worker?.id || d.worker || null,
        date: rawDate || "Today",
        time: rawTime || "10:00 AM",
        duration: d.duration || d.service?.duration || 45,
        price: parseFloat(d.price || d.service?.price || d.total_amount || 0),
        status: (d.status || "pending").toLowerCase(),
        payment_method: d.payment_method || "pay_at_venue",
        payment_status:
          d.payment_status ||
          (d.status === "completed" ? "paid" : "due_on_arrival"),
        location: d.organization?.location || "Lagos, Nigeria",
        phone: d.organization?.phone || "+234 812 345 6789",
        image: d.organization?.image || d.organization?.avatar_url || null,
      });
      setNewDate(rawDate);
      setNewTime(normalizeTimeForInput(rawTime));
    } catch (err) {
      console.error("Failed to load appointment:", err);
      setError("Could not retrieve appointment details from server.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const isWithinTwoHours = () => {
    if (!apt?.date || !apt?.time) return false;
    try {
      const normalizedTime = normalizeTimeForInput(apt.time) || apt.time;
      const apptDateTime = new Date(`${apt.date} ${normalizedTime}`);
      if (isNaN(apptDateTime.getTime())) return false;

      const diffHours =
        (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      return diffHours < 2;
    } catch {
      return false;
    }
  };

  const handleCancelConfirm = async () => {
    if (isWithinTwoHours()) {
      setShowCancelModal(false);
      setFeedback({
        type: "error",
        message:
          "Cancellation is not permitted within 2 hours of your scheduled appointment time. Please call the venue directly.",
      });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await api.patch(`/api/v1/appointments/${id}/`, { status: "cancelled" });
      setApt((prev) => ({ ...prev, status: "cancelled" }));
      setShowCancelModal(false);
      setFeedback({
        type: "success",
        message: "Your appointment has been cancelled.",
      });
    } catch (err) {
      console.error("Cancel failed:", err);
      setShowCancelModal(false);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Appointments cannot be cancelled within 2 hours of the scheduled start time.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    setActionLoading(true);
    setRescheduleError(null);
    setFeedback(null);

    try {
      await api.patch(`/api/v1/appointments/${id}/`, {
        date: newDate,
        time: newTime,
        status: "confirmed",
      });
      setApt((prev) => ({
        ...prev,
        date: newDate,
        time: newTime,
        status: "confirmed",
      }));
      setShowReschedule(false);
      setFeedback({
        type: "success",
        message: "Appointment rescheduled successfully.",
      });
    } catch (err) {
      console.error("Reschedule failed:", err);
      const conflictMsg =
        err.response?.data?.time?.[0] ||
        err.response?.data?.detail ||
        "This specialist is already booked for this slot. Please select another time.";
      setRescheduleError(conflictMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RoleNavbar />
        <main className="lg:ml-64 min-h-[75vh] flex flex-col items-center justify-center p-6 gap-4">
          <img
            src="/queless.png"
            alt="QueueLess"
            className="h-12 w-auto animate-pulse"
          />
          <p className="text-xs font-medium text-slate-400">
            Loading appointment details...
          </p>
        </main>
      </div>
    );
  }

  if (error || !apt) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RoleNavbar />
        <main className="lg:ml-64 min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Appointment Not Found
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "This booking does not exist in the database."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/customer/appointments")}
              className="btn-primary text-xs px-5 py-2.5 font-semibold"
            >
              Back to Appointments
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isCancelled = apt.status === "cancelled";
  const isCompleted = apt.status === "completed";
  const lockedWithinTwoHours = isWithinTwoHours();

  const statusStyles = isCancelled
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : isCompleted
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-teal-50 text-teal-700 border-teal-200";

  const statusDot = isCancelled
    ? "bg-rose-500"
    : isCompleted
      ? "bg-emerald-500"
      : "bg-teal-500";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/customer/appointments")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 transition"
          >
            <ChevronLeft size={18} />
            Back to my appointments
          </button>

          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-sm">
            <img src="/queless.png" alt="QueueLess" className="h-4 w-auto" />
            <p className="text-xs text-slate-400 font-semibold">Booking Ref</p>
            <p className="font-mono text-xs font-bold text-slate-800">
              #{String(apt.id).slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Action Feedback Banner */}
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

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Venue Cover Banner */}
              <div className="relative h-44 sm:h-52 w-full bg-[#102A43] overflow-hidden">
                <img
                  src={apt.image || FALLBACK_VENUE_IMAGE}
                  alt={apt.org}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/85 via-[#102A43]/40 to-transparent" />

                <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-3.5 py-1.5 shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    {apt.status}
                  </p>
                </div>

                <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                      {apt.service}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
                      {apt.org}
                    </h1>
                    <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-1.5">
                      <MapPin size={14} className="text-teal-300 shrink-0" />
                      {apt.location}
                    </p>
                  </div>

                  {apt.orgId && (
                    <Link
                      to={`/customer/org/${apt.orgId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition"
                    >
                      View Venue
                      <ArrowUpRight size={14} />
                    </Link>
                  )}
                </div>
              </div>

              {/* 3 Metric Specs */}
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">
                    Appointment Schedule
                  </p>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${statusStyles}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                    <p>{apt.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      Assigned Specialist
                    </p>
                    <p className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <User size={15} className="text-teal-600 shrink-0" />
                      {apt.worker}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      Scheduled Time
                    </p>
                    <p className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <Clock size={15} className="text-teal-600 shrink-0" />
                      {apt.date} at {apt.time}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      Estimated Session
                    </p>
                    <p className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <Sparkles size={15} className="text-teal-600 shrink-0" />
                      {apt.duration} Minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <p className="text-slate-900 font-bold text-sm">
                  Free Cancellation Policy
                </p>
                <p>
                  You can reschedule or cancel this reservation without penalty
                  up to 2 hours before your appointment. Please arrive 10
                  minutes prior to {apt.time}.
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="space-y-6 lg:sticky lg:top-8"
          >
            {/* Payment & Actions Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  Payment Summary
                </h3>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-5 w-auto"
                />
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <p>Payment Method</p>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Banknote size={15} className="text-emerald-600" />
                    <p>Pay at Venue</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <p>Payment Status</p>
                  <div
                    className={`font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <p>{isCompleted ? "Paid at Venue" : "Due Upon Arrival"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <p className="font-bold text-slate-900 text-sm">Total Fee</p>
                  <p className="text-2xl font-black text-teal-600">
                    {formatNaira(apt.price)}
                  </p>
                </div>
              </div>

              {!isCancelled && !isCompleted && (
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleError(null);
                      setShowReschedule(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-teal-300 transition flex items-center justify-center gap-2"
                  >
                    <Calendar size={15} className="text-teal-600" />
                    Reschedule Appointment
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading || lockedWithinTwoHours}
                    onClick={() => setShowCancelModal(true)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition ${
                      lockedWithinTwoHours
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    }`}
                    title={
                      lockedWithinTwoHours
                        ? "Cancellations locked within 2 hours of appointment"
                        : "Cancel Reservation"
                    }
                  >
                    {actionLoading
                      ? "Cancelling..."
                      : lockedWithinTwoHours
                        ? "Cancellation Locked (< 2 Hours)"
                        : "Cancel Reservation (Free)"}
                  </button>
                </div>
              )}
            </div>

            {/* Contact Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-slate-900 truncate">{apt.org}</p>
                <p className="text-slate-500">{apt.phone}</p>
              </div>
              <a
                href={`tel:${apt.phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-teal-50 hover:text-teal-700 transition shrink-0"
              >
                <Phone size={14} />
                Call
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showReschedule && (
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar size={17} className="text-teal-600" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Reschedule Appointment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="text-slate-400 hover:text-slate-700 transition"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {rescheduleError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <AlertCircle
                    size={15}
                    className="text-rose-600 shrink-0 mt-0.5"
                  />
                  <p>{rescheduleError}</p>
                </div>
              )}

              <form onSubmit={handleReschedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select New Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select New Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Our system verifies specialist availability instantly.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReschedule(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    {actionLoading ? "Verifying..." : "Confirm New Time"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
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
                    Cancel Appointment?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to cancel this reservation with{" "}
                    {apt.org}? Free cancellation applies since it is more than 2
                    hours away.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCancelConfirm}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  {actionLoading ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
