import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  Mail,
  AlertCircle,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/auth/users/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setUsers(raw);
    } catch (err) {
      console.error("Failed to fetch real users:", err);
      setError("Could not retrieve user directory from backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (id, currentStatus) => {
    setFeedback(null);
    try {
      await api.patch(`/api/v1/auth/users/${id}/`, {
        is_active: !currentStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_active: !currentStatus } : u,
        ),
      );
      setFeedback({
        type: "success",
        message: `User account ${!currentStatus ? "activated" : "suspended"}.`,
      });
    } catch (err) {
      console.error("Status update failed:", err);
      setFeedback({
        type: "error",
        message: "Could not update user status on server.",
      });
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);

    try {
      await api.delete(`/api/v1/auth/users/${deleteTarget.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setFeedback({
        type: "success",
        message: `User "${deleteTarget.email}" was permanently deleted.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setDeleteTarget(null);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Could not delete user. Check backend permissions.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <UsersIcon className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Platform User Directory
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Live accounts registered in the database ({users.length} total
              users).
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            <p>{refreshing ? "Syncing..." : "Sync Directory"}</p>
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
                aria-label="Dismiss notification"
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

        {/* Search & Filter */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by full name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2 text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {["all", "customer", "worker", "org_manager", "admin"].map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap capitalize ${
                    roleFilter === role
                      ? "bg-[#102A43] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {role === "all" ? "All Roles" : role.replace("_", " ")}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-10 w-auto animate-pulse"
              />
              <p className="text-xs text-slate-400">
                Querying registered users...
              </p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">User Profile</th>
                    <th className="py-4 px-6">Account Role</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6">Created On</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    const roleBadge =
                      u.role === "admin"
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : u.role === "org_manager" || u.role === "organization"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : u.role === "worker"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100";

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 border border-teal-100 font-bold flex items-center justify-center shrink-0">
                            {(u.full_name || u.email || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {u.full_name || "QueueLess User"}
                            </p>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail size={12} />
                              <p>{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${roleBadge}`}
                          >
                            {u.role === "admin" && <ShieldCheck size={12} />}
                            <p>{u.role?.replace("_", " ") || "Member"}</p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <p>{isActive ? "Active" : "Suspended"}</p>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "Active"}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleStatus(u.id, isActive)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                                isActive
                                  ? "border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700"
                                  : "border-emerald-500 text-emerald-700 bg-emerald-50"
                              }`}
                            >
                              {isActive ? "Suspend" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition inline-flex items-center gap-1"
                              title="Permanently Delete User"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-8 w-auto mx-auto opacity-80"
              />
              <p className="text-slate-400 text-xs">
                No users found in database matching your filter.
              </p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
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
                    Delete User Permanently?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to permanently delete{" "}
                    <strong>
                      {deleteTarget.full_name || deleteTarget.email}
                    </strong>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDeleteUser}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  {deleting ? "Deleting..." : "Yes, Delete User"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
