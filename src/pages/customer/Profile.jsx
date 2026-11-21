import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import {
  ChevronRight,
  Star,
  Heart,
  HelpCircle,
  LogOut,
  Camera,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Bell,
  Lock,
  FileText,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Member";

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [stats, setStats] = useState({
    bookingsCount: 0,
    favoritesCount: 0,
    reviewsCount: 0,
  });

  const [formData, setFormData] = useState({
    name: displayName,
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name:
          user.full_name ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const fetchCustomerActivity = useCallback(async () => {
    try {
      const [apptRes, favRes] = await Promise.allSettled([
        api.get("/api/v1/appointments/"),
        api.get("/api/v1/organizations/favourites/"),
      ]);

      const bookings =
        apptRes.status === "fulfilled"
          ? Array.isArray(apptRes.value.data)
            ? apptRes.value.data.length
            : apptRes.value.data?.results?.length || 0
          : 0;

      const favorites =
        favRes.status === "fulfilled"
          ? Array.isArray(favRes.value.data)
            ? favRes.value.data.length
            : favRes.value.data?.results?.length || 0
          : 0;

      setStats({
        bookingsCount: bookings,
        favoritesCount: favorites,
        reviewsCount: 0,
      });
    } catch {
      // Retain counts
    }
  }, []);

  useEffect(() => {
    fetchCustomerActivity();
  }, [fetchCustomerActivity]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (PNG, JPG, JPEG).");
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg("");
    const data = new FormData();
    data.append("avatar", file);

    try {
      const res = await api.patch("/api/v1/auth/me/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateProfile(res.data);
      setSuccessMsg("Profile picture updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      const url = URL.createObjectURL(file);
      updateProfile({ avatar_url: url });
      setSuccessMsg("Avatar preview updated.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
      };

      const { data } = await api.patch("/api/v1/auth/me/", payload);
      updateProfile(data);
      setSuccessMsg("Profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.phone?.[0] ||
        "Could not save profile changes to database.";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText.trim() !== "DELETE") {
      setErrorMsg("Please type DELETE exactly to confirm account removal.");
      return;
    }

    setDeletingAccount(true);
    setErrorMsg("");
    try {
      await api.delete("/api/v1/auth/me/delete-account/");
      await logout();
      navigate("/register", { replace: true });
    } catch (err) {
      console.error("Account deletion failed:", err);
      setShowDeleteModal(false);
      setErrorMsg(
        err.response?.data?.detail ||
          "Failed to delete account. Please verify backend connection.",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account & Profile
          </h1>
          <p className="text-sm text-slate-500">
            Manage your personal details, preferences, security, and saved
            favorites.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <p>{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg("")}
              className="text-rose-500 hover:text-rose-800"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 1 COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 lg:sticky lg:top-8"
          >
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4 group">
                <div className="w-28 h-28 rounded-full bg-teal-50 text-teal-800 overflow-hidden flex items-center justify-center text-3xl font-black ring-4 ring-teal-500/10 shadow-inner">
                  {user?.avatar_url || user?.avatar ? (
                    <img
                      src={user.avatar_url || user.avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayName[0]?.toUpperCase() || "U"
                  )}
                </div>

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center cursor-pointer shadow-md transition-all group-hover:scale-105"
                  title="Upload profile photo"
                >
                  <Camera
                    size={16}
                    className={uploadingAvatar ? "animate-spin" : ""}
                  />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatar}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>

              <h2 className="text-lg font-black text-slate-900">
                {displayName}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {user?.email}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mt-3 border border-emerald-100">
                <ShieldCheck size={14} />
                <p>Verified Account</p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 w-full pt-5 mt-5 border-t border-slate-100 text-center">
                <div className="p-2">
                  <p className="text-lg font-black text-slate-900">
                    {stats.bookingsCount}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">
                    Bookings
                  </p>
                </div>
                <div className="p-2 border-x border-slate-100">
                  <p className="text-lg font-black text-slate-900">
                    {stats.favoritesCount}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">
                    Favorites
                  </p>
                </div>
                <div className="p-2">
                  <p className="text-lg font-black text-slate-900">
                    {stats.reviewsCount}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">
                    Reviews
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-5 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center justify-center gap-2 transition"
              >
                <LogOut size={15} />
                Log out of QueueLess
              </button>
            </div>

            {/* QueueLess Access Card */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-teal-50/70 to-white border border-teal-100 shadow-sm flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Sparkles size={19} className="text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                  <p className="text-slate-900 font-bold">
                    QueueLess Priority Access
                  </p>
                  <p>
                    Virtual queue tickets and free appointment cancellations up
                    to 2 hours before your session.
                  </p>
                </div>
              </div>
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-5 w-auto shrink-0"
              />
            </div>
          </motion.div>

          {/* RIGHT 2 COLUMNS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Personal Information Form */}
            <div className="rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-900">
                    Personal Information
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update your full name and phone number
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {successMsg && (
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <p>{successMsg}</p>
                    </div>
                  )}
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-5 w-auto"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        className="input pl-10 text-sm"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="tel"
                        placeholder="+234 812 345 6789"
                        className="input pl-10 text-sm"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address (Read-only)
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="email"
                      disabled
                      className="input pl-10 text-sm bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
                      value={formData.email}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    To change your email address, please contact support.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-xs px-6 py-2.5 rounded-xl font-bold shadow-sm"
                  >
                    {saving ? "Saving changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Activity & Favorites */}
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Activity & Favorites
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Link
                  to="/customer/favourites"
                  className="p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition bg-white flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Heart size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                        Saved Businesses
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {stats.favoritesCount} businesses saved
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/customer/reviews"
                  className="p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition bg-white flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Star size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                        My Reviews & Ratings
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Feedback left for specialists
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>

            {/* Security & Support */}
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Security & Support
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                <Link
                  to="/customer/settings"
                  className="flex items-center justify-between py-3.5 hover:text-teal-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-slate-400" />
                    <p className="font-semibold text-slate-800">
                      Password & Security
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                <Link
                  to="/customer/notifications"
                  className="flex items-center justify-between py-3.5 hover:text-teal-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-slate-400" />
                    <p className="font-semibold text-slate-800">
                      Notification Preferences
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                <Link
                  to="/customer/help"
                  className="flex items-center justify-between py-3.5 hover:text-teal-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-slate-400" />
                    <p className="font-semibold text-slate-800">
                      Help Center & Support
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                <Link
                  to="/customer/terms"
                  className="flex items-center justify-between py-3.5 hover:text-teal-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-400" />
                    <p className="font-semibold text-slate-800">
                      Terms of Service & Privacy Policy
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-3xl p-6 border border-rose-200 bg-rose-50/40 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <Trash2 size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-rose-950">
                    Permanent Account Deletion
                  </h3>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Permanently purge your profile, appointment records, and
                    history from our database. Once deleted, your email is freed
                    up if you ever wish to create a fresh account.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => {
                    setDeleteConfirmText("");
                    setShowDeleteModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition inline-flex items-center gap-2"
                >
                  Permanently Delete My Account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-sm">
                      Delete Account Permanently?
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This action cannot be undone. Type{" "}
                      <strong className="text-rose-700">DELETE</strong> below to
                      confirm.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="input text-sm"
                />

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      deletingAccount || deleteConfirmText.trim() !== "DELETE"
                    }
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition"
                  >
                    {deletingAccount ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
