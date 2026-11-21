import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchAppointments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/appointments/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const parsed = raw.map((item) => ({
        id: item.id,
        service:
          item.service_name ||
          item.service?.name ||
          item.service ||
          "Appointment",
        org:
          item.organization_name ||
          item.organization?.name ||
          item.org ||
          "Service Center",
        worker:
          item.worker_name || item.worker?.full_name || "Assigned Specialist",
        date: item.date || item.scheduled_date || "Scheduled Date",
        time: item.time || item.scheduled_time || "Scheduled Time",
        duration: item.duration || item.service?.duration || 45,
        price: parseFloat(
          item.price || item.service?.price || item.total_amount || 0,
        ),
        status: (item.status || "pending").toLowerCase(),
        image:
          item.organization?.image ||
          item.organization?.avatar_url ||
          item.image ||
          null,
      }));

      setAppointments(parsed);
    } catch (err) {
      console.error("Failed to load customer appointments:", err);
      setError("Could not retrieve appointments from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const upcomingList = appointments.filter(
    (a) => a.status !== "completed" && a.status !== "cancelled",
  );
  const completedList = appointments.filter((a) => a.status === "completed");
  const cancelledList = appointments.filter((a) => a.status === "cancelled");

  const tabList =
    tab === "Upcoming"
      ? upcomingList
      : tab === "Past"
        ? completedList
        : cancelledList;

  const query = search.trim().toLowerCase();
  const filteredList = tabList.filter(
    (apt) =>
      apt.service.toLowerCase().includes(query) ||
      apt.org.toLowerCase().includes(query) ||
      apt.worker.toLowerCase().includes(query),
  );

  const tabs = [
    { id: "Upcoming", label: "Upcoming", count: upcomingList.length },
    { id: "Past", label: "Completed", count: completedList.length },
    { id: "Cancelled", label: "Cancelled", count: cancelledList.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Appointments
            </h1>
            <p className="text-sm text-slate-500">
              View your live bookings, reschedule times, or cancel sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchAppointments(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-teal-600" : ""}
              />
              <p>{refreshing ? "Syncing..." : "Sync"}</p>
            </button>

            <Link
              to="/customer/explore"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm"
            >
              <Plus size={16} />
              Book New Appointment
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-5 border border-slate-200 flex items-center gap-4 bg-white shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <CalendarCheck size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Bookings
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {loading ? "..." : appointments.length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl p-5 border border-slate-200 flex items-center gap-4 bg-white shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Upcoming
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {loading ? "..." : upcomingList.length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl p-5 border border-slate-200 flex items-center gap-4 bg-white shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cancelled
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {loading ? "..." : cancelledList.length}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Search & Tabs */}
        <div className="rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white">
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                  tab === t.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <p>{t.label}</p>
                <div
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    tab === t.id
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  <p>{t.count}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="relative sm:w-72">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search service, venue, or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2 text-sm w-full"
            />
          </div>
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-10 w-auto animate-pulse"
            />
            <p className="text-xs font-medium text-slate-400">
              Loading your bookings...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((apt, index) => {
              const isCompleted = apt.status === "completed";
              const isCancelled = apt.status === "cancelled";

              const statusPill = isCompleted
                ? "bg-emerald-50 text-emerald-700"
                : isCancelled
                  ? "bg-rose-50 text-rose-700"
                  : "bg-teal-50 text-teal-700";

              const statusDot = isCompleted
                ? "bg-emerald-500"
                : isCancelled
                  ? "bg-rose-500"
                  : "bg-teal-500";

              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.04, 0.25),
                  }}
                  className="rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition bg-white group"
                >
                  <div>
                    {/* Venue Cover */}
                    <div className="relative h-32 w-full bg-[#102A43] overflow-hidden">
                      <img
                        src={apt.image || FALLBACK_VENUE_IMAGE}
                        alt={apt.org}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/80 via-[#102A43]/30 to-transparent" />

                      <div
                        className={`absolute top-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize shadow-sm bg-white/95 backdrop-blur-sm ${
                          isCompleted
                            ? "text-emerald-700"
                            : isCancelled
                              ? "text-rose-700"
                              : "text-teal-700"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusDot}`}
                        />
                        <p>{apt.status}</p>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300 truncate">
                          {apt.service}
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                          {apt.org}
                        </h3>
                        <div
                          className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${statusPill}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${statusDot}`}
                          />
                          <p>{apt.status}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <Calendar
                            size={14}
                            className="text-teal-600 shrink-0"
                          />
                          <p>
                            {apt.date} at {apt.time}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-slate-500">
                          <div className="flex items-center gap-2 min-w-0">
                            <User
                              size={14}
                              className="text-slate-400 shrink-0"
                            />
                            <p className="truncate">{apt.worker}</p>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 shrink-0">
                            <Clock size={13} />
                            <p>{apt.duration} mins</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Fee
                      </p>
                      <p className="text-base font-black text-teal-600">
                        {formatNaira(apt.price)}
                      </p>
                    </div>

                    <Link
                      to={`/customer/appointments/${apt.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102A43] hover:bg-teal-600 text-white text-xs font-bold transition shadow-sm"
                    >
                      Manage
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="col-span-full rounded-3xl p-12 text-center bg-white border border-dashed border-slate-200 space-y-4">
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-9 w-auto mx-auto opacity-80"
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    No appointments found under "{tab}"
                  </p>
                  <p className="text-xs text-slate-500">
                    {search
                      ? "Try clearing your search filter or switching tabs."
                      : "Schedule your next salon, clinic, or consultation visit in seconds."}
                  </p>
                </div>
                <Link
                  to="/customer/explore"
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  <Plus size={15} />
                  Explore Businesses
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
