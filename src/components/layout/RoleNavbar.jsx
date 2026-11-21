import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/Logo";
import {
  Calendar,
  Clock,
  Compass,
  User,
  Users,
  Building2,
  Scissors,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Search,
  Briefcase,
  MessageCircle,
  Flag,
  Menu,
  X,
} from "lucide-react";

const ROOT_PATHS = new Set(["/customer", "/worker", "/organization", "/admin"]);

const ROLE_LABELS = {
  customer: "Personal",
  worker: "Specialist",
  organization: "Organization",
  org_manager: "Organization",
  admin: "Admin",
};

export default function RoleNavbar() {
  const { user, activeRole, primaryRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  let links = [];
  if (activeRole === "customer") {
    links = [
      { to: "/customer", label: "Home", icon: Compass },
      { to: "/customer/explore", label: "Explore Services", icon: Search },
      { to: "/customer/appointments", label: "My Bookings", icon: Calendar },
      { to: "/customer/queue", label: "Live Queue", icon: Clock },
      { to: "/customer/profile", label: "Profile", icon: User },
      { to: "/messages", label: "Messages", icon: MessageCircle },
      { to: "/report", label: "Report a concern", icon: Flag },
      {
        to: "/organization/create",
        label: "Create organization",
        icon: Building2,
      },
    ];
  } else if (activeRole === "worker") {
    links = [
      { to: "/worker", label: "Dashboard", icon: Briefcase },
      { to: "/worker/schedule", label: "Client Schedule", icon: Calendar },
      { to: "/worker/earnings", label: "My Earnings", icon: BarChart3 },
      { to: "/worker/profile", label: "Availability", icon: Settings },
      { to: "/messages", label: "Messages", icon: MessageCircle },
      { to: "/report", label: "Report a concern", icon: Flag },
    ];
  } else if (activeRole === "organization" || activeRole === "org_manager") {
    links = [
      { to: "/organization", label: "Overview", icon: Building2 },
      { to: "/organization/queue", label: "Queue Terminal", icon: Clock },
      { to: "/organization/services", label: "Services Menu", icon: Scissors },
      { to: "/organization/staff", label: "Specialists", icon: Users },
      {
        to: "/organization/settings",
        label: "Org Profile & Photos",
        icon: Settings,
      },
      { to: "/messages", label: "Messages", icon: MessageCircle },
      { to: "/report", label: "Report a concern", icon: Flag },
    ];
  } else if (activeRole === "admin") {
    links = [
      { to: "/admin", label: "Overview", icon: BarChart3 },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/organizations", label: "Organizations", icon: Building2 },
      { to: "/admin/bookings", label: "Bookings", icon: Calendar },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/reports", label: "User reports", icon: Flag },
    ];
  }

  const isStaffOrBusiness =
    primaryRole !== "customer" ||
    (user?.organizations?.length || 0) > 0 ||
    (user?.memberships?.length || 0) > 0;

  const toggleRoleMode = () => {
    if (activeRole === "customer") {
      switchRole(primaryRole === "customer" ? "organization" : primaryRole);
      navigate(
        primaryRole === "admin"
          ? "/admin"
          : primaryRole === "worker"
            ? "/worker"
            : "/organization",
      );
    } else {
      switchRole("customer");
      navigate("/customer");
    }
    setMobileOpen(false);
  };

  const checkActive = (to) => {
    if (ROOT_PATHS.has(to)) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const isOrgMode =
    activeRole === "organization" || activeRole === "org_manager";
  const activeOrg = user?.organizations?.[0];
  const roleLabel = ROLE_LABELS[activeRole] || "Personal";
  const workspaceTitle = isOrgMode
    ? activeOrg?.name || "My Organization"
    : user?.full_name || "Personal Account";
  const switchLabel =
    activeRole === "customer"
      ? activeOrg?.name
        ? `Switch to ${activeOrg.name}`
        : "Switch to Workspace"
      : "Switch to Personal";

  const avatarSrc = user?.avatar_url || user?.avatar;
  const userInitial = (user?.full_name || user?.email || "U")[0].toUpperCase();

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <Logo className="h-7" to="/" />

        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
            <p>{roleLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Open Navigation"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="w-72 bg-white h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <Logo className="h-7" to="/" />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    aria-label="Close navigation"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="py-3 border-b border-slate-100 space-y-2.5">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Active Workspace
                      </p>
                      <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                        {workspaceTitle}
                      </p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-extrabold uppercase shrink-0">
                      <p>{roleLabel}</p>
                    </div>
                  </div>

                  {isStaffOrBusiness && (
                    <button
                      type="button"
                      onClick={toggleRoleMode}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-teal-800 flex items-center gap-2 transition"
                    >
                      <RefreshCw size={13} className="shrink-0" />
                      <p className="truncate">{switchLabel}</p>
                    </button>
                  )}
                </div>

                <nav className="py-4 space-y-1">
                  {links.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkActive(item.to);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? "bg-teal-50 text-teal-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon size={16} />
                        <p>{item.label}</p>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.full_name || user?.email}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col justify-between hidden lg:flex fixed inset-y-0 z-30">
        <div className="flex-1 overflow-y-auto">
          {/* Clean Brand Row */}
          <div className="px-5 h-16 border-b border-slate-100 flex items-center">
            <Logo className="h-7" to="/" />
          </div>

          {/* Workspace & Role Card */}
          <div className="p-4 border-b border-slate-100 space-y-2.5">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#102A43] text-teal-300 flex items-center justify-center shrink-0 overflow-hidden">
                  {isOrgMode && activeOrg?.logo_url ? (
                    <img
                      src={activeOrg.logo_url}
                      alt={activeOrg.name}
                      className="w-full h-full object-cover"
                    />
                  ) : isOrgMode ? (
                    <Building2 size={15} />
                  ) : (
                    <User size={15} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {roleLabel}
                  </p>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {workspaceTitle}
                  </p>
                </div>
              </div>
            </div>

            {isStaffOrBusiness && (
              <button
                type="button"
                onClick={toggleRoleMode}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-bold text-slate-700 hover:text-teal-800 transition flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RefreshCw size={13} className="text-teal-600 shrink-0" />
                  <p className="truncate">{switchLabel}</p>
                </div>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = checkActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  <p>{item.label}</p>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.full_name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.full_name || "My Account"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
