import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle2,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

export default function Register() {
  const { registerWithEmail, loginWithGoogle, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (form.password.length < 6)
      return setError("Your password must contain at least 6 characters.");
    if (form.password !== form.confirm_password)
      return setError("Your passwords do not match.");
    setBusy(true);
    try {
      await registerWithEmail(form);
      navigate("/customer", { replace: true });
    } catch {
      /* AuthContext provides the message. */
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate("/customer", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Image Showcase */}
        <section className="relative hidden lg:flex lg:col-span-6 lg:sticky lg:top-6 lg:h-[calc(100vh-112px)] min-h-[540px] max-h-[680px] rounded-3xl overflow-hidden bg-[#102A43] text-white shadow-xl items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1500&q=85"
            alt="People collaborating smoothly"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F33]/45 via-[#0B1F33]/65 to-[#0B1F33]/55" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 px-10 xl:px-14 py-10 max-w-xl text-center flex flex-col items-center"
          >
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
              Your time deserves better.
            </h1>
            <p className="text-slate-100 mt-4 text-base leading-relaxed max-w-md">
              Book trusted services, manage appointments, and connect directly
              with the people taking care of you.
            </p>
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 text-sm font-medium text-teal-100">
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
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8"
          >
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                One account lets you book services and create an organization
                whenever you're ready.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <label className="block text-xs font-semibold text-slate-700">
                  First name
                  <input
                    required
                    autoComplete="given-name"
                    className="input mt-1.5"
                    value={form.first_name}
                    onChange={update("first_name")}
                    placeholder="First name"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Last name
                  <input
                    required
                    autoComplete="family-name"
                    className="input mt-1.5"
                    value={form.last_name}
                    onChange={update("last_name")}
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Email address
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    className="input pl-10"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Password
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    required
                    minLength={6}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="input pl-10 pr-11"
                    value={form.password}
                    onChange={update("password")}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Confirm password
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="input pl-10"
                    value={form.confirm_password}
                    onChange={update("confirm_password")}
                    placeholder="Enter password again"
                  />
                </div>
              </label>

              <button
                disabled={busy}
                className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                {busy ? "Creating account…" : "Create account"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-xs font-medium text-slate-400">or</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={google}
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

            <p className="text-center text-sm text-slate-500 mt-5">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-teal-700 hover:text-teal-800"
              >
                Sign in
              </Link>
            </p>
            <p className="text-center text-[11px] text-slate-400 mt-3 leading-relaxed">
              By continuing, you agree to use QueueLess respectfully and follow
              our platform guidelines.
            </p>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
