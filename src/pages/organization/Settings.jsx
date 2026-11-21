import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import {
  Building2,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Upload,
  Globe,
  X,
} from "lucide-react";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=85";

export default function OrgSettings() {
  const { user, updateProfile } = useAuth();

  const [orgId, setOrgId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    address: "",
    city: "Lagos",
    state: "Lagos",
    phone: "",
    email: "",
    accepts_walk_ins: true,
    auto_confirm: true,
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const loadOrganization = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, catRes] = await Promise.allSettled([
        api.get("/api/v1/manage/organizations/"),
        api.get("/api/v1/categories/"),
      ]);

      if (catRes.status === "fulfilled") {
        const cList = Array.isArray(catRes.value.data)
          ? catRes.value.data
          : catRes.value.data?.results || [];
        setCategories(cList);
      }

      if (orgRes.status === "fulfilled") {
        const list = Array.isArray(orgRes.value.data)
          ? orgRes.value.data
          : orgRes.value.data?.results || [];
        const current = list[0];
        if (current) {
          setOrgId(current.id);
          setForm({
            name: current.name || "",
            category_id: current.category_id || "",
            description: current.description || "",
            address: current.address || "",
            city: current.city || "Lagos",
            state: current.state || "Lagos",
            phone: current.phone || "",
            email: current.email || "",
            accepts_walk_ins: current.accepts_walk_ins ?? true,
            auto_confirm: current.auto_confirm ?? true,
          });
          setLogoPreview(current.logo_url || "");
          setCoverPreview(current.cover_url || "");
        }
      }
    } catch (err) {
      console.error("Failed to load organization settings:", err);
      setFeedback({
        type: "error",
        message: "Could not load organization settings from server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  const handleFile = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "Please choose a valid image file (PNG, JPG, WEBP).",
      });
      return;
    }
    const preview = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(preview);
    } else {
      setCoverFile(file);
      setCoverPreview(preview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    setFeedback(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("address", form.address.trim());
      fd.append("city", form.city.trim() || "Lagos");
      fd.append("state", form.state.trim() || "Lagos");
      fd.append("phone", form.phone.trim());
      fd.append("email", form.email.trim());
      fd.append("accepts_walk_ins", String(form.accepts_walk_ins));
      fd.append("auto_confirm", String(form.auto_confirm));
      if (form.category_id) fd.append("category_id", String(form.category_id));
      if (logoFile) fd.append("logo", logoFile);
      if (coverFile) fd.append("cover", coverFile);

      const { data } = await api.patch(
        `/api/v1/manage/organizations/${orgId}/`,
        fd,
      );

      setLogoFile(null);
      setCoverFile(null);
      setLogoPreview(data.logo_url || logoPreview);
      setCoverPreview(data.cover_url || coverPreview);

      const updatedOrgs = (user?.organizations || []).map((o) =>
        String(o.id) === String(data.id) ? { ...o, ...data } : o,
      );
      updateProfile({
        organizations: updatedOrgs.length ? updatedOrgs : [data],
      });

      setFeedback({
        type: "success",
        message: "Organization profile and photos saved successfully.",
      });
    } catch (err) {
      console.error("Failed to save organization settings:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Could not save organization changes. Check your fields and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RoleNavbar />
        <main className="lg:ml-64 min-h-[75vh] flex flex-col items-center justify-center gap-4 p-6">
          <img
            src="/queless.png"
            alt="QueueLess"
            className="h-12 w-auto animate-pulse"
          />
          <p className="text-xs font-medium text-slate-400">
            Loading organization profile...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Building2 className="text-teal-600" size={24} />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Organization Profile & Photos
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Upload your business logo, cover photo, and keep your public details
            up to date.
          </p>
        </div>

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
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover + Logo Visual Editor */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="relative h-48 sm:h-56 bg-[#102A43]">
              <img
                src={coverPreview || FALLBACK_COVER}
                alt="Organization cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/80 via-[#102A43]/30 to-transparent" />

              <label className="absolute top-4 right-4 cursor-pointer rounded-xl bg-white/95 hover:bg-white text-slate-900 px-3.5 py-2 text-xs font-bold inline-flex items-center gap-2 shadow-md transition">
                <Upload size={14} className="text-teal-600" />
                <p>Change Cover Photo</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile("cover")}
                />
              </label>

              <div className="absolute -bottom-10 left-6 flex items-end gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-teal-700 font-black text-2xl">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={form.name || "Logo"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (form.name[0] || "O").toUpperCase()
                    )}
                  </div>
                  <label
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center cursor-pointer shadow-md transition"
                    title="Upload organization logo"
                  >
                    <Camera size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFile("logo")}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-14 px-6 pb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {form.name || "Your Organization"}
                </h2>
                <p className="text-xs text-slate-500">
                  Click the camera icon to upload your logo, or Change Cover
                  Photo for your banner.
                </p>
              </div>
            </div>
          </div>

          {/* Organization Information Form */}
          <div className="rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white shadow-sm space-y-5">
            <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
              Business Information
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                Organization Name
                <input
                  className="input mt-1.5"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              {categories.length > 0 && (
                <label className="block text-xs font-bold text-slate-700">
                  Category
                  <select
                    className="input mt-1.5"
                    value={form.category_id}
                    onChange={(e) =>
                      setForm({ ...form, category_id: e.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className="block text-xs font-bold text-slate-700">
              Description
              <textarea
                rows={3}
                className="input mt-1.5 py-2.5"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Street Address
              <div className="relative mt-1.5">
                <MapPin
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  className="input pl-10"
                  required
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                City
                <input
                  className="input mt-1.5"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                State
                <input
                  className="input mt-1.5"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                Business Phone
                <div className="relative mt-1.5">
                  <Phone
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    className="input pl-10"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Business Email
                <div className="relative mt-1.5">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    className="input pl-10"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 grid sm:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.accepts_walk_ins}
                  onChange={(e) =>
                    setForm({ ...form, accepts_walk_ins: e.target.checked })
                  }
                  className="w-4 h-4 accent-teal-600"
                />
                <div>
                  <p className="font-bold text-slate-900">
                    Accept Walk-in Queue
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Allow customers to join your live virtual line
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.auto_confirm}
                  onChange={(e) =>
                    setForm({ ...form, auto_confirm: e.target.checked })
                  }
                  className="w-4 h-4 accent-teal-600"
                />
                <div>
                  <p className="font-bold text-slate-900">
                    Auto-Confirm Bookings
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Confirm available time slots immediately
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe size={14} />
                <p>Visible on QueueLess Explore</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-7 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Organization Changes"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
