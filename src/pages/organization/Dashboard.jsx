import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Settings,
} from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1500&q=80";

export default function OrgDashboard() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [org, setOrg] = useState(() => user?.organizations?.[0] || null);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    queueCount: 0,
    totalBookings: 0,
    completed: 0,
    revenue: 0,
  });
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const loadOrgData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [aptRes, orgRes] = await Promise.allSettled([
        api.get("/api/v1/appointments/"),
        api.get("/api/v1/manage/organizations/"),
      ]);

      if (orgRes.status === "fulfilled") {
        const orgList = Array.isArray(orgRes.value.data)
          ? orgRes.value.data
          : orgRes.value.data?.results || [];
        if (orgList.length > 0) {
          setOrg(orgList[0]);
          updateProfile({ organizations: orgList });
        }
      }

      if (aptRes.status === "fulfilled") {
        const raw = Array.isArray(aptRes.value.data)
          ? aptRes.value.data
          : aptRes.value.data?.results || [];

        const parsed = raw.map((item) => ({
          id: item.id,
          customer_name:
            item.customer_name || item.customer?.full_name || "Walk-in Client",
          service_name:
            item.service_name || item.service?.name || "General Service",
          worker_name:
            item.worker_name || item.worker?.full_name || "Assigned Specialist",
          duration: item.duration || item.service?.duration || 0,
          price: parseFloat(
            item.price || item.service?.price || item.total_amount || 0,
          ),
          status: (item.status || "pending").toLowerCase(),
          time: item.time || item.scheduled_time || "Scheduled",
        }));

        setAppointments(parsed);

        const completedList = parsed.filter((a) => a.status === "completed");
        const inQueueList = parsed.filter(
          (a) => a.status === "pending" || a.status === "in_progress",
        );
        const totalRev = completedList.reduce(
          (sum, a) => sum + (a.price || 0),
          0,
        );

        setStats({
          queueCount: inQueueList.length,
          totalBookings: parsed.length,
          completed: completedList.length,
          revenue: totalRev,
        });
      } else {
        throw new Error("Appointments request failed");
      }
    } catch (err) {
      console.error("Org dashboard fetch error:", err);
      setError(
        "Unable to load live dashboard statistics. Please verify backend connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrgData();
    const timer = setInterval(() => loadOrgData(true), 15000);
    return () => clearInterval(timer);
  }, [loadOrgData]);

  const orgName =
    org?.name ||
    user?.organizations?.[0]?.name ||
    user?.organization_name ||
    "Your Organization";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* BUSINESS CONSOLE BANNER */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl bg-[#102A43] text-white shadow-md border border-slate-200/40"
        >
          <img
            src={org?.cover_url || HERO_IMAGE}
            alt={orgName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33]/95 via-[#102A43]/85 to-[#16A6A1]/45" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Business Console
                </p>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {orgName}
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed">
                Live operational view of client appointments, walk-ins, and
                daily intake.
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/organization/queue"
                  className="btn-primary bg-teal-500 hover:bg-teal-400 text-[#0B1F33] text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm"
                >
                  <Users size={15} />
                  Open Live Queue
                </Link>

                <Link
                  to="/organization/settings"
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-2 backdrop-blur-md border border-white/15 transition"
                >
                  <Settings size={14} />
                  Edit Profile & Photos
                </Link>

                <button
                  type="button"
                  onClick={() => loadOrgData(true)}
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

            <div className="hidden lg:flex items-center justify-center rounded-2xl bg-white/95 w-24 h-24 overflow-hidden shadow-md shrink-0 border-2 border-white">
              {org?.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={orgName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="w-14 h-14 object-contain scale-[1.8]"
                />
              )}
            </div>
          </div>
        </motion.section>

        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => loadOrgData()}
              className="underline hover:text-amber-950 font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/organization/queue"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition group shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Waiting in Line
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1 group-hover:text-teal-700 transition">
                  {stats.queueCount}
                </p>
                <p className="text-xs text-teal-600 font-semibold mt-1">
                  Active tickets
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
            </div>
          </Link>

          <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Bookings
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {stats.totalBookings}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Booked in database
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Completed Sessions
                </p>
                <p className="text-3xl font-black text-emerald-600 mt-1">
                  {stats.completed}
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Served clients
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Revenue (Recorded)
                </p>
                <p className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">
                  {formatNaira(stats.revenue)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  From completed orders
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Today's Appointment Schedule
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time bookings fetched from backend
                  </p>
                </div>
                <Link
                  to="/organization/queue"
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Manage Terminal
                  <ArrowRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-9 w-auto animate-pulse"
                  />
                  <p className="text-xs text-slate-400">
                    Loading live appointments...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 transition flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 font-bold flex items-center justify-center shrink-0">
                          {apt.customer_name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {apt.customer_name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {apt.service_name} · Staff:{" "}
                            <strong className="text-slate-700">
                              {apt.worker_name}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-xs font-bold text-slate-900">
                          {apt.time}
                        </p>
                        <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                          <p>{apt.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {appointments.length === 0 && (
                    <div className="p-10 text-center text-slate-400 text-xs">
                      No customer appointments found in your database yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  Management Shortcuts
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <Link
                  to="/organization/services"
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                        Services & Menu
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Add & edit service prices
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/organization/staff"
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                        Team & Specialists
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Manage teammates & shifts
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/organization/settings"
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Settings size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                        Profile & Photos
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Logo, cover & business info
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl p-5 bg-gradient-to-br from-teal-50/70 to-white border border-teal-100 shadow-sm flex items-start gap-3">
              <Sparkles size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed space-y-0.5">
                <p className="text-slate-900 font-bold">
                  Live Queue Integration
                </p>
                <p>
                  Customers booking through the app receive real-time ticket
                  updates as your team advances the queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
