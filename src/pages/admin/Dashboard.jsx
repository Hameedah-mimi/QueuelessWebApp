import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import {
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=85";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [usersList, setUsersList] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);

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
      const [usersRes, orgsRes, bookingsRes] = await Promise.allSettled([
        api.get("/api/v1/auth/users/"),
        api.get("/api/v1/organizations/"),
        api.get("/api/v1/appointments/"),
      ]);

      const unwrap = (res) => {
        if (res.status !== "fulfilled") return [];
        const d = res.value.data;
        return Array.isArray(d) ? d : d?.results || [];
      };

      setUsersList(unwrap(usersRes));
      setOrgsList(unwrap(orgsRes));
      setBookingsList(unwrap(bookingsRes));
    } catch (err) {
      console.error("Admin live fetch error:", err);
      setError("Unable to synchronize live platform data from Django server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const t = setInterval(() => fetchDashboardData(true), 15000);
    return () => clearInterval(t);
  }, [fetchDashboardData]);

  const totalUsersCount = usersList.length;
  const pendingOrgs = orgsList.filter(
    (o) => o.status === "pending" || o.is_verified === false,
  );
  const totalBookingsCount = bookingsList.length;
  const totalRevenue = bookingsList
    .filter((b) => (b.status || "").toLowerCase() === "completed")
    .reduce(
      (acc, curr) => acc + parseFloat(curr.price || curr.total_amount || 0),
      0,
    );

  const customersCount = usersList.filter(
    (u) => !u.role || u.role === "customer" || u.role === "user",
  ).length;
  const workersCount = usersList.filter((u) => u.role === "worker").length;
  const managersCount = usersList.filter(
    (u) => u.role === "org_manager" || u.role === "organization",
  ).length;

  const roleSplitData = [
    { name: "Users", value: customersCount, color: "#16A6A1" },
    { name: "Workers", value: workersCount, color: "#102A43" },
    { name: "Organizations", value: managersCount, color: "#F59E0B" },
  ].filter((item) => item.value > 0);

  const displayName =
    user?.first_name ||
    user?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl bg-[#102A43] text-white shadow-md border border-slate-200/40"
        >
          <img
            src={HERO_IMAGE}
            alt="Admin operations"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33]/95 via-[#102A43]/85 to-[#16A6A1]/45" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Platform Administration
              </p>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Admin Dashboard
              </h1>
              <p className="text-slate-200 text-sm leading-relaxed">
                Welcome back, {displayName} · Live platform statistics synced
                from database.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-2 backdrop-blur-md border border-white/15 transition"
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "animate-spin text-teal-300" : ""}
                  />
                  <p>{refreshing ? "Syncing..." : "Sync Live Data"}</p>
                </button>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center rounded-2xl bg-white/95 px-5 py-4 shadow-md shrink-0">
              <img src="/queless.png" alt="QueueLess" className="h-9 w-auto" />
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-4">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              className="underline hover:text-amber-950 font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Clickable KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Users
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1 group-hover:text-teal-700 transition">
                  {loading ? "..." : totalUsersCount}
                </p>
                <p className="text-xs font-semibold text-teal-600 mt-1">
                  Live in database
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users size={22} />
              </div>
            </div>
          </Link>

          <Link
            to="/admin/organizations"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Organizations
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1 group-hover:text-teal-700 transition">
                  {loading ? "..." : orgsList.length}
                </p>
                <p className="text-xs font-semibold text-amber-600 mt-1">
                  {pendingOrgs.length} awaiting approval
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Building2 size={22} />
              </div>
            </div>
          </Link>

          <Link
            to="/admin/bookings"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Bookings
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1 group-hover:text-teal-700 transition">
                  {loading ? "..." : totalBookingsCount}
                </p>
                <p className="text-xs font-semibold text-blue-600 mt-1">
                  All schedules
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar size={22} />
              </div>
            </div>
          </Link>

          <Link
            to="/admin/analytics"
            className="rounded-2xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all group shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Completed Volume
                </p>
                <p className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">
                  {loading ? "..." : formatNaira(totalRevenue)}
                </p>
                <p className="text-xs font-semibold text-emerald-600 mt-1">
                  Recorded revenue
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={22} />
              </div>
            </div>
          </Link>
        </div>

        {/* User Mix & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Live User Mix
              </h2>
              <Link
                to="/admin/users"
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                Manage
              </Link>
            </div>

            {roleSplitData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={175}>
                  <PieChart>
                    <Pie
                      data={roleSplitData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {roleSplitData.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {roleSplitData.map((r) => (
                    <div
                      key={r.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: r.color }}
                        />
                        <p>{r.name}</p>
                      </div>
                      <p className="font-bold text-slate-900">{r.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No registered users in the database yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-teal-600" />
                <p>Recent Platform Activity</p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p>Live Database Feed</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {bookingsList.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {b.service_name || b.service?.name || "Appointment"} ·{" "}
                      <strong className="text-teal-700">
                        {b.organization_name ||
                          b.org ||
                          b.organization?.name ||
                          "Venue"}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Client:{" "}
                      {b.customer_name || b.customer?.full_name || "Client"} ·{" "}
                      {b.time || b.scheduled_time || "Scheduled"}
                    </p>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-slate-200 shrink-0">
                    <p>{b.status || "Active"}</p>
                  </div>
                </div>
              ))}

              {bookingsList.length === 0 && (
                <div className="py-16 text-center space-y-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-8 w-auto mx-auto opacity-80"
                  />
                  <p className="text-xs text-slate-400">
                    No appointments or activity logged in the database yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Approvals Callout */}
        {pendingOrgs.length > 0 && (
          <Link
            to="/admin/organizations"
            className="rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/30 hover:border-amber-400 hover:shadow-md transition-all shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {pendingOrgs.length} organization
                  {pendingOrgs.length > 1 ? "s" : ""} awaiting verification
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Review licenses and verify their profiles to allow them to
                  onboard specialists and accept queue bookings.
                </p>
              </div>
            </div>

            <div className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold shrink-0 inline-flex items-center gap-1.5 shadow-sm self-start sm:self-auto">
              <p>Review Now</p>
              <ArrowRight size={13} />
            </div>
          </Link>
        )}
      </main>
    </div>
  );
}
