import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/v1/reports/");
      setReports(listOf(data));
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Reports could not be loaded. The moderation API must be enabled on the backend.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (report, status) => {
    try {
      await api.patch(`/api/v1/reports/${report.id}/`, { status });
      setReports((old) =>
        old.map((item) => (item.id === report.id ? { ...item, status } : item)),
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "The report status could not be updated.",
      );
    }
  };

  const visible = reports.filter(
    (item) => filter === "all" || (item.status || "pending") === filter,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[.18em] text-teal-700 font-bold">
              Trust & Safety
            </p>
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="text-amber-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight">
                User Reports
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Review reports submitted about users and organizations.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin text-teal-600" : ""}
            />
            <p>Refresh</p>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800 font-semibold flex items-center gap-2.5"
          >
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "reviewing", "resolved", "dismissed"].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize border transition ${
                  filter === status
                    ? "bg-[#102A43] text-white border-[#102A43] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 shadow-sm">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-10 w-auto animate-pulse"
              />
              <p className="text-xs text-slate-400">Loading reports...</p>
            </div>
          ) : visible.length > 0 ? (
            visible.map((report, idx) => (
              <motion.article
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(idx * 0.04, 0.2),
                }}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="text-xs font-bold uppercase tracking-wide text-teal-800 bg-teal-50 rounded-full px-3 py-1">
                        <p>{report.target_type || "Report"}</p>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        #{report.id}
                      </p>
                      <div className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-3 py-1 capitalize">
                        <p>{report.status || "pending"}</p>
                      </div>
                    </div>

                    <h2 className="font-bold text-slate-900 text-base pt-1">
                      {report.target_name ||
                        report.reported_user_name ||
                        report.reported_organization_name ||
                        "Reported account"}
                    </h2>

                    <p className="text-sm font-semibold text-slate-700">
                      {report.reason || "No reason provided"}
                    </p>

                    <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">
                      {report.details ||
                        report.description ||
                        "No additional details."}
                    </p>

                    <div className="text-xs text-slate-400 pt-1 flex items-center gap-1.5">
                      <Clock3 size={13} />
                      <p>
                        Submitted{" "}
                        {report.created_at
                          ? new Date(report.created_at).toLocaleString()
                          : "date unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {(report.status || "pending") !== "reviewing" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(report, "reviewing")}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                      >
                        Mark reviewing
                      </button>
                    )}
                    {(report.status || "pending") !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(report, "resolved")}
                        className="btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        Resolve
                      </button>
                    )}
                    {(report.status || "pending") !== "dismissed" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(report, "dismissed")}
                        className="px-3.5 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-9 w-auto mx-auto opacity-80"
              />
              <ShieldCheck size={30} className="mx-auto text-slate-300" />
              <h2 className="font-bold text-slate-800 text-sm">
                No reports found
              </h2>
              <p className="text-xs text-slate-500">
                There are no reports in this category.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
