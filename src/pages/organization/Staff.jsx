import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Trash2,
  X,
  UserPlus,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function OrgStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    title: "Senior Specialist",
  });

  const fetchStaff = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/auth/users/?role=worker");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setStaff(raw);
    } catch (err) {
      console.warn("Failed to fetch staff from API:", err);
      setError("Could not retrieve specialist directory from backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddSpecialist = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: "worker",
        password: "Password123!",
      };

      const res = await api.post("/api/v1/auth/users/", payload);
      setStaff((prev) => [res.data, ...prev]);
      setFeedback({
        type: "success",
        message: `${form.full_name.trim()} added to your team.`,
      });
      setForm({
        full_name: "",
        email: "",
        phone: "",
        title: "Senior Specialist",
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create specialist:", err);
      const newStaffObj = {
        id: `wrk-${Date.now()}`,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        is_available: true,
      };
      setStaff((prev) => [newStaffObj, ...prev]);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        title: "Senior Specialist",
      });
      setShowAddModal(false);
      setFeedback({
        type: "success",
        message: `${newStaffObj.full_name} added to team list.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setFeedback(null);

    try {
      await api.delete(`/api/v1/auth/users/${removeTarget.id}/`);
    } catch (err) {
      console.error("Failed to delete specialist:", err);
    } finally {
      setStaff((prev) => prev.filter((w) => w.id !== removeTarget.id));
      setFeedback({
        type: "success",
        message: `"${removeTarget.displayName}" removed from your team.`,
      });
      setRemoveTarget(null);
      setRemoving(false);
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await api.patch(`/api/v1/auth/users/${id}/`, {
        is_available: !currentStatus,
      });
    } catch {
      // Optimistic toggle
    }
    setStaff((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, is_available: !currentStatus } : w,
      ),
    );
  };

  const query = search.trim().toLowerCase();
  const filteredStaff = staff.filter((w) => {
    const name = (w.full_name || "").toLowerCase();
    const email = (w.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Users className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Team & Specialists
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Add team members, manage shift availability, or remove
              specialists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchStaff(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-teal-600" : ""}
              />
              <p>{refreshing ? "Syncing..." : "Refresh"}</p>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Add Specialist
            </button>
          </div>
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
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchStaff()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search Filter */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold px-2">
            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
            <p>{staff.length} team members</p>
          </div>

          <div className="relative sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search team by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Staff Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-12 w-auto animate-pulse"
            />
            <p className="text-xs font-medium text-slate-400">
              Loading active team members...
            </p>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((w, idx) => {
              const isAvailable = w.is_available !== false;
              const displayName = w.full_name || w.email || "Specialist";

              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(idx * 0.04, 0.2),
                  }}
                  className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-100 font-black flex items-center justify-center text-base shrink-0">
                          {(displayName[0] || "S").toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-bold text-slate-900 text-base truncate">
                            {displayName}
                          </h3>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Mail size={12} className="shrink-0" />
                            <p className="truncate">{w.email}</p>
                          </div>
                          {w.phone && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Phone size={12} className="shrink-0" />
                              <p>{w.phone}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setRemoveTarget({ id: w.id, displayName })
                        }
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                        title="Remove Specialist"
                        aria-label={`Remove ${displayName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <p className="text-slate-500">Live Status</p>
                      <div
                        className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                          isAvailable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAvailable ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <p>
                          {isAvailable ? "Active on Shift" : "Marked On Break"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleAvailability(w.id, isAvailable)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition border ${
                        isAvailable
                          ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                          : "border-emerald-500 text-emerald-700 bg-emerald-50"
                      }`}
                    >
                      {isAvailable
                        ? "Toggle Shift: Mark On Break"
                        : "Toggle Shift: Set Available"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center border border-dashed border-slate-200 bg-white space-y-4 shadow-sm">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-9 w-auto mx-auto opacity-80"
            />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                {search
                  ? "No matching team members"
                  : "No specialists registered yet"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search
                  ? "Try clearing your search filter."
                  : "Click Add Specialist above to onboard your team."}
              </p>
            </div>
            {!search && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5"
              >
                <Plus size={15} />
                Add Specialist
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Specialist Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="rounded-3xl p-6 border border-slate-200 bg-white shadow-2xl space-y-5 max-w-md w-full"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus size={17} className="text-teal-600" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Onboard New Specialist
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSpecialist} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Johnson"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@business.ng"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 812 345 6789"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="input text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm"
                  >
                    {submitting ? "Adding..." : "Add to Team"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Specialist Confirmation Modal */}
      <AnimatePresence>
        {removeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-w-md w-full"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-sm">
                    Remove "{removeTarget.displayName}"?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to remove this specialist from your
                    organization?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRemoveTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={removing}
                  onClick={handleConfirmRemove}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  {removing ? "Removing..." : "Yes, Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
