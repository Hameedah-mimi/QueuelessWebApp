import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const reasons = [
  "Harassment or abusive behaviour",
  "Fraud, scam or misleading information",
  "Fake organization or impersonation",
  "Unsafe or inappropriate service",
  "Spam or suspicious activity",
  "Other",
];

export default function Report() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    target_type: searchParams.get("type") === "user" ? "user" : "organization",
    target_id: searchParams.get("id") || "",
    target_name: searchParams.get("name") || "",
    reason: reasons[0],
    details: "",
  });

  const [state, setState] = useState({
    busy: false,
    error: "",
    success: "",
  });

  const update = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      return navigate("/login", { state: { from: { pathname: "/report" } } });
    }

    setState({ busy: true, error: "", success: "" });
    try {
      await api.post("/api/v1/reports/", {
        ...form,
        target_id: form.target_id.trim(),
      });
      setState({
        busy: false,
        error: "",
        success: "Thank you. Your report has been submitted for review.",
      });
      setForm({
        target_type: "organization",
        target_id: "",
        target_name: "",
        reason: reasons[0],
        details: "",
      });
    } catch (error) {
      setState({
        busy: false,
        error:
          error.response?.data?.detail ||
          "We couldn't submit the report. Please check the details and try again.",
        success: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Link
          to="/customer"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition"
        >
          <ArrowLeft size={16} />
          Back to QueueLess
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-9 space-y-6"
        >
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
                  Report a user or organization
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Tell us what happened. Reports are reviewed by the QueueLess
                  trust and safety team and should only contain accurate
                  information.
                </p>
              </div>
            </div>

            <img
              src="/queless.png"
              alt="QueueLess"
              className="hidden sm:block h-6 w-auto shrink-0"
            />
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-100 text-teal-900 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <p>
              Reports are confidential. Do not include passwords, payment card
              details, or other private credentials.
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle
                size={17}
                className="text-rose-600 shrink-0 mt-0.5"
              />
              <p>{state.error}</p>
            </div>
          )}

          {state.success && (
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <CheckCircle2
                size={17}
                className="text-emerald-600 shrink-0 mt-0.5"
              />
              <p>{state.success}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-700">
                What would you like to report?
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {["organization", "user"].map((type) => (
                  <label
                    key={type}
                    className={`border rounded-xl p-3.5 flex gap-2.5 items-center cursor-pointer transition ${
                      form.target_type === type
                        ? "border-teal-500 bg-teal-50/70 text-teal-900"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="target_type"
                      value={type}
                      checked={form.target_type === type}
                      onChange={update("target_type")}
                      className="accent-teal-600"
                    />
                    <p className="text-sm font-semibold capitalize">{type}</p>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                {form.target_type === "user" ? "User" : "Organization"} ID or
                profile link
                <input
                  className="input mt-1.5"
                  required
                  value={form.target_id}
                  onChange={update("target_id")}
                  placeholder="Enter ID or profile URL"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Name (if known)
                <input
                  className="input mt-1.5"
                  value={form.target_name}
                  onChange={update("target_name")}
                  placeholder="Name shown on QueueLess"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-slate-700">
              Reason
              <select
                className="input mt-1.5"
                value={form.reason}
                onChange={update("reason")}
              >
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              What happened?
              <textarea
                className="input mt-1.5 min-h-32 resize-y py-2.5"
                required
                minLength={15}
                value={form.details}
                onChange={update("details")}
                placeholder="Share relevant details, dates, or appointment references..."
              />
            </label>

            <button
              type="submit"
              disabled={state.busy}
              className="btn-primary w-full py-3.5 rounded-xl font-bold shadow-sm"
            >
              {state.busy
                ? "Submitting report..."
                : "Submit confidential report"}
            </button>
          </form>
        </motion.section>
      </main>
    </div>
  );
}
