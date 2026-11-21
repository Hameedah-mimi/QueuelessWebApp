import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Building2,
  CheckCircle2,
  XCircle,
  MapPin,
  RefreshCw,
  AlertCircle,
  Search,
  X,
} from "lucide-react";

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80";

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchOrgs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/organizations/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setOrgs(raw);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError("Could not fetch organizations list from Django.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleApprove = async (id) => {
    setFeedback(null);
    try {
      await api.post(`/api/v1/manage/organizations/${id}/publish/`);
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, is_verified: true, status: "approved" } : o,
        ),
      );
      setFeedback({
        type: "success",
        message: "Organization approved and published.",
      });
    } catch {
      try {
        await api.patch(`/api/v1/organizations/${id}/`, {
          is_verified: true,
          status: "approved",
        });
        setOrgs((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, is_verified: true, status: "approved" } : o,
          ),
        );
        setFeedback({
          type: "success",
          message: "Organization approved.",
        });
      } catch {
        setFeedback({
          type: "error",
          message: "Failed to approve organization.",
        });
      }
    }
  };

  const handleReject = async (id) => {
    setFeedback(null);
    try {
      await api.patch(`/api/v1/organizations/${id}/`, {
        is_verified: false,
        status: "rejected",
      });
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, is_verified: false, status: "rejected" } : o,
        ),
      );
      setFeedback({
        type: "success",
        message: "Organization status updated.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to update organization status.",
      });
    }
  };

  const query = search.trim().toLowerCase();
  const filteredOrgs = orgs.filter((o) => {
    const isApproved = o.status === "approved" || o.is_verified === true;
    const matchesTab =
      tab === "all" ||
      (tab === "approved" && isApproved) ||
      (tab === "pending" && !isApproved);
    const matchesSearch =
      (o.name || "").toLowerCase().includes(query) ||
      (o.location || o.address || "").toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Building2 className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Organization Management
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Verify businesses and manage approvals across QueueLess.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrgs(true)}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            <p>{refreshing ? "Syncing..." : "Refresh"}</p>
          </button>
        </div>

        {/* Feedback Banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border p-4 flex items-center justify-between gap-4 text-xs font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 shrink-0"
                  />
                ) : (
                  <XCircle size={18} className="text-rose-600 shrink-0" />
                )}
                <p>{feedback.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Search & Tabs */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search organizations by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2 text-sm w-full"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["all", "pending", "approved"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${
                  tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-10 w-auto animate-pulse"
            />
            <p className="text-xs text-slate-400">
              Loading organizations from backend...
            </p>
          </div>
        ) : filteredOrgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org, idx) => {
              const isApproved =
                org.status === "approved" || org.is_verified === true;

              return (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(idx * 0.04, 0.2),
                  }}
                  className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition"
                >
                  <div>
                    <div className="relative h-44 bg-[#102A43]">
                      <img
                        src={
                          org.image || org.avatar_url || FALLBACK_VENUE_IMAGE
                        }
                        alt={org.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/60 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <div
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm ${
                            isApproved
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          <p>
                            {isApproved ? "Approved" : "Pending Verification"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {org.name}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <MapPin size={14} className="text-teal-600 shrink-0" />
                        <p className="truncate">
                          {org.location ||
                            org.address ||
                            "Location Not Specified"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        Category: {org.category || "General Service"}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                    {!isApproved ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(org.id)}
                          className="btn-primary text-xs py-2.5 px-4 rounded-xl flex-1 font-bold inline-flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(org.id)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 transition"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReject(org.id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Suspend Business
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center border border-dashed border-slate-200 bg-white space-y-3">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-9 w-auto mx-auto opacity-80"
            />
            <p className="text-slate-400 text-xs">
              No organizations found matching your filter.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
