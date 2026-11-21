import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { motion } from "framer-motion";

export default function Login() {
  const { loginWithEmail, loginWithGoogle, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolveDashboard = (role) => {
    if (from) return from;
    switch (role) {
      case "admin":
        return "/admin";
      case "org_manager":
      case "organization":
        return "/organization";
      case "worker":
        return "/worker";
      default:
        return "/customer";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loggedInUser = await loginWithEmail(email.trim(), password);
      const destination = resolveDashboard(loggedInUser?.role);
      navigate(destination, { replace: true });
    } catch {
      // Handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginWithGoogle();
      const destination = resolveDashboard(loggedInUser?.role);
      navigate(destination, { replace: true });
    } catch (err) {
      if (err?.message) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      <main className="min-h-[calc(100vh-64px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 grid lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Image Showcase */}
        <section className="relative hidden lg:flex lg:col-span-6 rounded-3xl overflow-hidden bg-[#102A43] text-white shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=85"
            alt="Professional services and consulting workspace"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33] via-[#102A43]/60 to-[#102A43]/15" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 mt-auto p-10 xl:p-12 max-w-xl"
          >
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
              Skip the wait, keep your day moving.
            </h1>
            <p className="text-slate-200 mt-4 text-base leading-relaxed">
              Book clinics, salons, mechanics, and professional sessions without
              sitting in a crowded waiting room.
            </p>
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 text-sm font-medium text-teal-100">
              <CheckCircle2 size={18} className="text-teal-300 shrink-0" />
              <p>One account for every QueueLess experience</p>
            </div>
          </motion.div>
        </section>

        {/* Right Form Card */}
        <section className="lg:col-span-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-9"
          >
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Sign in to manage your bookings, track live queues, or switch
                into your organization.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Email address
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </label>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="input pl-10 pr-11"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                {loading ? "Signing in…" : "Sign in"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-xs font-medium text-slate-400">or</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-teal-300 transition flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.22-.66-.35-1.36-.35-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500 mt-6">
              New to QueueLess?{" "}
              <Link
                to="/register"
                className="font-bold text-teal-700 hover:text-teal-800"
              >
                Create an account
              </Link>
            </p>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
