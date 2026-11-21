import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/Logo";

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, activeRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const currentWorkspace = activeRole || user?.role || "customer";
  const dashboardUrl =
    currentWorkspace === "organization" || currentWorkspace === "org_manager"
      ? "/organization"
      : currentWorkspace === "worker"
        ? "/worker"
        : currentWorkspace === "admin"
          ? "/admin"
          : "/customer";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo className="h-8" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <Link to="/" className="hover:text-teal-600 transition">
              Home
            </Link>
            <Link to="/explore" className="hover:text-teal-600 transition">
              Explore Services
            </Link>
            <a href="/#how-it-works" className="hover:text-teal-600 transition">
              How It Works
            </a>
            <Link to="/contact" className="hover:text-teal-600 transition">
              Contact
            </Link>
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardUrl}
                  className="px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition inline-flex items-center gap-1.5"
                >
                  <LayoutDashboard size={14} />
                  My Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition inline-flex items-center gap-1"
                  title="Sign out"
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-teal-600 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                >
                  Get Started
                  <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3 shadow-xl overflow-hidden"
          >
            <Link
              to="/"
              className="block py-2 text-xs font-bold text-slate-700 hover:text-teal-600"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/explore"
              className="block py-2 text-xs font-bold text-slate-700 hover:text-teal-600"
              onClick={() => setOpen(false)}
            >
              Explore Services
            </Link>
            <Link
              to="/contact"
              className="block py-2 text-xs font-bold text-slate-700 hover:text-teal-600"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
            <a
              href="/#how-it-works"
              className="block py-2 text-xs font-bold text-slate-700 hover:text-teal-600"
              onClick={() => setOpen(false)}
            >
              How It Works
            </a>

            <div className="pt-3 border-t border-slate-100">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    to={dashboardUrl}
                    className="w-full py-2.5 px-4 text-xs font-bold text-teal-700 bg-teal-50 rounded-xl text-center block"
                    onClick={() => setOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2 text-xs font-bold text-rose-600 text-center block"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-center"
                    onClick={() => setOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2.5 text-xs font-bold bg-teal-600 text-white rounded-xl text-center shadow-sm"
                    onClick={() => setOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
