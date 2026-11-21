import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import {
  Calendar,
  Clock,
  Star,
  ArrowRight,
  MapPin,
  UserCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1500&q=85";

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80";

export default function CustomerDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [aptRes, orgRes] = await Promise.allSettled([
        api.get("/api/v1/appointments/"),
        api.get("/api/v1/organizations/"),
      ]);

      if (aptRes.status === "fulfilled") {
        const raw = Array.isArray(aptRes.value.data)
          ? aptRes.value.data
          : aptRes.value.data?.results || [];
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
          worker: item.worker_name || item.worker?.full_name || "Specialist",
          date: item.date || item.scheduled_date || "Scheduled Date",
          time: item.time || item.scheduled_time || "Scheduled Time",
          duration: item.duration || item.service?.duration || 45,
          price: parseFloat(
            item.price || item.service?.price || item.total_amount || 0,
          ),
          status: (item.status || "pending").toLowerCase(),
        }));
        setAppointments(parsed);
      }

      if (orgRes.status === "fulfilled") {
        const orgList = Array.isArray(orgRes.value.data)
          ? orgRes.value.data
          : orgRes.value.data?.results || [];
        setOrganizations(orgList);
      }
    } catch (err) {
      console.error("Failed to load customer dashboard data:", err);
      setError("Could not sync live data from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const upcomingApts = appointments
    .filter((a) => a.status !== "completed" && a.status !== "cancelled")
    .slice(0, 2);

  const activeTicket = appointments.find(
    (a) => a.status === "in_progress" || a.status === "pending",
  );

  const featuredOrgs = organizations.slice(0, 4);

  const displayName =
    user?.first_name ||
    user?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HERO GREETING BANNER */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl bg-[#102A43] text-white shadow-md border border-slate-200/40"
        >
          <img
            src={HERO_IMAGE}
            alt="QueueLess service scheduling"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33]/95 via-[#102A43]/85 to-[#16A6A1]/50" />

          <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Personal Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Welcome back, {displayName}
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl">
                Book appointments, skip the physical wait with live virtual
                queues, and discover trusted businesses near you.
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/customer/explore"
                  className="btn-primary bg-teal-500 hover:bg-teal-400 text-[#0B1F33] font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 shadow-sm text-xs sm:text-sm"
                >
                  <Search size={16} />
                  Explore Businesses
                </Link>
                <Link
                  to="/customer/appointments"
                  className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition inline-flex items-center gap-2 backdrop-blur-md border border-white/15"
                >
                  View Bookings
                  <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition inline-flex items-center gap-2 backdrop-blur-md border border-white/15"
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
              <img src="/queless.png" alt="QueueLess" className="h-10 w-auto" />
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
              onClick={() => fetchDashboardData()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3 QUICK ACCESS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/customer/explore"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group flex items-start gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Star size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition text-sm">
                Find Services
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse verified salons, clinics, repair shops, and spas.
              </p>
            </div>
          </Link>

          <Link
            to="/customer/appointments"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group flex items-start gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition text-sm">
                My Bookings
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reschedule appointments, view details, or cancel anytime.
              </p>
            </div>
          </Link>

          <Link
            to="/customer/queue"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group flex items-start gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition text-sm">
                Virtual Queue
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Monitor live wait times and check in without sitting in a lobby.
              </p>
            </div>
          </Link>
        </div>

        {/* 2-COLUMN MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6">
            {/* UPCOMING APPOINTMENTS */}
            <div className="rounded-3xl p-6 border border-slate-200 shadow-sm bg-white space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Next Upcoming Appointments
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your scheduled visits and calendar reservations
                  </p>
                </div>
                <Link
                  to="/customer/appointments"
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1"
                >
                  View all ({appointments.length})
                  <ArrowRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-8 w-auto animate-pulse"
                  />
                  <p className="text-xs text-slate-400">
                    Loading your scheduled appointments...
                  </p>
                </div>
              ) : upcomingApts.length > 0 ? (
                <div className="space-y-3.5">
                  {upcomingApts.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-teal-300 transition bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#102A43] text-teal-300 flex items-center justify-center shadow-sm shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                              {apt.service}
                            </h4>
                            <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <p>{apt.status}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {apt.org} · With {apt.worker}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-teal-600" />
                              <p>
                                {apt.date} at {apt.time} ({apt.duration} mins)
                              </p>
                            </div>
                            <p className="text-teal-700 font-bold">
                              {formatNaira(apt.price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/customer/appointments/${apt.id}`}
                        className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 shrink-0"
                      >
                        Manage
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Calendar size={26} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">
                      No upcoming appointments
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Discover trusted businesses near you and reserve your spot
                      in seconds.
                    </p>
                  </div>
                  <Link
                    to="/customer/explore"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold transition"
                  >
                    Explore Services
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>

            {/* FEATURED BUSINESSES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Verified Businesses
                  </h2>
                  <p className="text-xs text-slate-500">
                    Top service providers ready for booking on QueueLess
                  </p>
                </div>
                <Link
                  to="/customer/explore"
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1"
                >
                  Browse all ({organizations.length})
                  <ArrowRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-8 w-auto animate-pulse"
                  />
                  <p className="text-xs text-slate-400">
                    Loading registered businesses...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredOrgs.map((org, idx) => (
                    <motion.div
                      key={org.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="rounded-3xl border border-slate-200 overflow-hidden bg-white hover:shadow-md hover:border-teal-300 transition group flex flex-col justify-between shadow-sm"
                    >
                      <div className="relative h-36 w-full bg-[#102A43] overflow-hidden">
                        <img
                          src={
                            org.image || org.avatar_url || FALLBACK_VENUE_IMAGE
                          }
                          alt={org.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/50 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                          <Star
                            size={12}
                            className="text-amber-400 fill-amber-400"
                          />
                          <p>{org.rating || "5.0"}</p>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition truncate">
                            {org.name}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                            <MapPin
                              size={12}
                              className="text-teal-600 shrink-0"
                            />
                            {org.location ||
                              org.address ||
                              "Location Not Specified"}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p>Open for Bookings</p>
                          </div>
                          <Link
                            to={`/customer/org/${org.id}`}
                            className="rounded-xl bg-slate-100 hover:bg-teal-600 text-slate-800 hover:text-white text-xs px-3.5 py-2 font-bold transition"
                          >
                            Book Spot
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {featuredOrgs.length === 0 && (
                    <div className="col-span-full rounded-3xl p-10 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200">
                      No businesses registered yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 lg:sticky lg:top-8">
            {/* LIVE QUEUE MONITOR */}
            <div className="rounded-3xl p-6 border border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-teal-50/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800">
                  <Clock size={15} className="text-teal-600" />
                  <p>Queue Monitor</p>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeTicket
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-300"
                  }`}
                />
              </div>

              {activeTicket ? (
                <div className="text-center py-3 space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Assigned Ticket
                  </p>
                  <p className="text-4xl font-black text-slate-900">
                    #{String(activeTicket.id).slice(0, 4)}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-medium">
                      Status:{" "}
                      <strong className="text-teal-600 uppercase">
                        {activeTicket.status}
                      </strong>
                    </p>
                    <p className="text-xs text-slate-500">{activeTicket.org}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      to="/customer/queue"
                      className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Open Live Ticket
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      You are not in any queue
                    </p>
                    <p className="text-xs text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                      Book a service or join a virtual queue to skip waiting in
                      a physical lobby.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      to="/customer/explore"
                      className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                    >
                      Explore Businesses
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ACCOUNT CARD */}
            <div className="rounded-3xl p-5 border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900">
                      Verified Account
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.email || "Signed in"}
                    </p>
                  </div>
                </div>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-5 w-auto shrink-0"
                />
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs text-slate-600 flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="text-teal-600 shrink-0 mt-0.5"
                />
                <p className="leading-relaxed">
                  Instant notifications enabled for bookings and queue ticket
                  alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
