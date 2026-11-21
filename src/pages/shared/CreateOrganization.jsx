import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ImagePlus,
  AlertCircle,
  ArrowRight,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=85";

export default function CreateOrganization() {
  const { user, updateProfile, switchRole } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    address: "",
    city: "Lagos",
    state: "Lagos",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/categories/")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setCategories(list);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  const update = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));

  const handleImage = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(url);
    } else {
      setCoverFile(file);
      setCoverPreview(url);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("address", form.address.trim());
      fd.append("city", form.city.trim() || "Lagos");
      fd.append("state", form.state.trim() || "Lagos");
      fd.append("phone", form.phone.trim());
      fd.append("email", form.email.trim());
      if (form.category_id) fd.append("category_id", String(form.category_id));
      if (logoFile) fd.append("logo", logoFile);
      if (coverFile) fd.append("cover", coverFile);

      const { data } = await api.post("/api/v1/manage/organizations/", fd);
      const organization = data.organization || data;
      const organizations = [...(user?.organizations || []), organization];
      const memberships = [
        ...(user?.memberships || []),
        {
          organization_id: organization.id,
          organization_name: organization.name,
          role: "owner",
        },
      ];
      updateProfile({ organizations, memberships });
      switchRole("organization");
      setSuccess("Your organization has been created.");
      navigate("/organization", { replace: true });
    } catch (err) {
      const errData = err.response?.data;
      let msg =
        errData?.detail ||
        errData?.error?.message ||
        "We couldn't create your organization. Please check the fields and try again.";

      if (
        !errData?.detail &&
        !errData?.error?.message &&
        typeof errData === "object" &&
        errData !== null
      ) {
        msg = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <Link
          to="/customer/profile"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="relative bg-[#102A43] text-white p-6 sm:p-9 overflow-hidden">
            <img
              src={HERO_IMAGE}
              alt="Create organization workspace"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33]/95 via-[#102A43]/85 to-[#16A6A1]/50" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex rounded-xl bg-white/15 backdrop-blur-md border border-white/15 p-3 text-teal-300">
                  <Building2 size={22} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Create your organization
                </h1>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                  Set up your service profile. Your account will become the
                  organization owner and can also continue booking as a normal
                  user anytime.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="p-6 sm:p-9 space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5"
              >
                <AlertCircle
                  size={17}
                  className="text-rose-600 shrink-0 mt-0.5"
                />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-700 flex items-start gap-2.5"
              >
                <CheckCircle2
                  size={17}
                  className="text-emerald-600 shrink-0 mt-0.5"
                />
                <p>{success}</p>
              </div>
            )}

            {/* Logo & Cover Upload */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">
                  Organization Logo (Optional)
                </p>
                <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex items-center gap-4 cursor-pointer bg-slate-50/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImage("logo")}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload size={18} className="text-teal-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      PNG or JPG square icon
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">
                  Cover Photo (Optional)
                </p>
                <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex items-center gap-4 cursor-pointer bg-slate-50/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImage("cover")}
                  />
                  <div className="w-20 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus size={18} className="text-teal-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {coverPreview ? "Change Cover" : "Upload Cover Photo"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Banner shown on Explore & Profile
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                Organization name
                <input
                  className="input mt-1.5"
                  required
                  value={form.name}
                  onChange={update("name")}
                  placeholder="e.g. City Care Clinic"
                />
              </label>

              {categories.length > 0 ? (
                <label className="block text-xs font-bold text-slate-700">
                  Category
                  <select
                    className="input mt-1.5"
                    value={form.category_id}
                    onChange={update("category_id")}
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="block text-xs font-bold text-slate-700">
                  Contact phone
                  <input
                    className="input mt-1.5"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="+234 812 345 6789"
                  />
                </label>
              )}
            </div>

            <label className="block text-xs font-bold text-slate-700">
              Description
              <textarea
                className="input mt-1.5 min-h-28 py-2.5"
                required
                value={form.description}
                onChange={update("description")}
                placeholder="Describe the services you provide..."
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Street address
              <input
                className="input mt-1.5"
                required
                value={form.address}
                onChange={update("address")}
                placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                City
                <input
                  className="input mt-1.5"
                  required
                  value={form.city}
                  onChange={update("city")}
                  placeholder="e.g. Lagos"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                State
                <input
                  className="input mt-1.5"
                  required
                  value={form.state}
                  onChange={update("state")}
                  placeholder="e.g. Lagos"
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {categories.length > 0 && (
                <label className="block text-xs font-bold text-slate-700">
                  Contact phone
                  <input
                    className="input mt-1.5"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="+234 812 345 6789"
                  />
                </label>
              )}

              <label
                className={`block text-xs font-bold text-slate-700 ${
                  categories.length === 0 ? "sm:col-span-2" : ""
                }`}
              >
                Business email
                <input
                  className="input mt-1.5"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="Business email"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3.5 rounded-xl font-bold inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {busy ? "Creating organization..." : "Create organization"}
              <ArrowRight size={16} />
            </button>
          </form>
        </motion.section>
      </main>
    </div>
  );
}
