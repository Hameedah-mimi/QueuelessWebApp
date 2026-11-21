import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Scissors,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  RefreshCw,
  Upload,
} from "lucide-react";

const FALLBACK_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80";

export default function OrgServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(10000);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchServices = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/manage/services/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setServices(raw);
    } catch (err) {
      console.warn("Failed to load services from manage endpoint:", err);
      setError("Could not retrieve service menu from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openAddModal = () => {
    setName("");
    setDuration(45);
    setPrice(10000);
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setModalError(null);
    setModalMode("add");
  };

  const openEditModal = (svc) => {
    setName(svc.name || "");
    setDuration(svc.duration_minutes || svc.duration || 45);
    setPrice(svc.price || 0);
    setDescription(svc.description || "");
    setImageFile(null);
    setImagePreview(svc.image_url || svc.image || null);
    setEditingId(svc.id);
    setModalError(null);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setModalError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setModalError("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    setModalError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("duration_minutes", parseInt(duration, 10));
      formData.append("price", parseFloat(price));

      if (description) {
        formData.append("description", description.trim());
      }

      if (imageFile instanceof File) {
        formData.append("image", imageFile);
      }

      if (modalMode === "add") {
        const { data } = await api.post("/api/v1/manage/services/", formData);
        setServices((prev) => [data, ...prev]);
        setFeedback({
          type: "success",
          message: "New service created successfully.",
        });
      } else if (modalMode === "edit") {
        const { data } = await api.patch(
          `/api/v1/manage/services/${editingId}/`,
          formData,
        );
        setServices((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...data } : s)),
        );
        setFeedback({
          type: "success",
          message: "Service details updated successfully.",
        });
      }

      closeModal();
    } catch (err) {
      console.error("Failed to save service:", err.response?.data || err);
      const errorData = err.response?.data;
      let msg = "Could not save changes.";

      if (errorData?.error?.message) {
        msg = errorData.error.message;
      } else if (typeof errorData === "object" && errorData !== null) {
        msg = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      }

      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);

    try {
      await api.delete(`/api/v1/manage/services/${deleteTarget.id}/`);
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setFeedback({
        type: "success",
        message: `"${deleteTarget.name}" removed from your service menu.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete service:", err);
      setDeleteTarget(null);
      setFeedback({
        type: "error",
        message: "Failed to remove service from database.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Scissors className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Services & Menu
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Add services, update prices, adjust session durations, and
              customize photos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchServices(true)}
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
              onClick={openAddModal}
              className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Add New Service
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
              onClick={() => fetchServices()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Services Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-12 w-auto animate-pulse"
            />
            <p className="text-xs font-medium text-slate-400">
              Loading services and photos...
            </p>
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, idx) => {
              const photo =
                svc.image_url || svc.image || FALLBACK_SERVICE_IMAGE;
              const durationTime = svc.duration_minutes || svc.duration || 45;

              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(idx * 0.04, 0.2),
                  }}
                  className="rounded-3xl border border-slate-200 bg-white overflow-hidden hover:border-teal-300 hover:shadow-md transition flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="relative h-44 w-full bg-[#102A43] overflow-hidden">
                      <img
                        src={photo}
                        alt={svc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/50 via-transparent to-transparent" />
                    </div>

                    <div className="p-5 space-y-2">
                      <h4 className="font-bold text-slate-900 text-base">
                        {svc.name}
                      </h4>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock size={13} className="text-teal-600 shrink-0" />
                        <p>{durationTime} Minutes Session</p>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 pt-1 leading-relaxed">
                          {svc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <p className="text-xl font-black text-teal-600">
                      {formatNaira(svc.price)}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(svc)}
                        className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition border border-slate-200 hover:border-teal-200 bg-white"
                        title="Edit Service & Photo"
                        aria-label={`Edit ${svc.name}`}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(svc)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                        title="Delete Service"
                        aria-label={`Delete ${svc.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
                No services added yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click Add New Service to create your first service offering and
                upload a photo.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              Add New Service
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalMode && (
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
              className="rounded-3xl p-6 border border-slate-200 bg-white shadow-2xl space-y-5 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-5 w-auto"
                  />
                  <h3 className="font-black text-slate-900 text-sm">
                    {modalMode === "edit"
                      ? "Edit Service Details & Photo"
                      : "Add New Service to Menu"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle
                    size={15}
                    className="text-rose-600 shrink-0 mt-0.5"
                  />
                  <p>{modalError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Service Photo {modalMode === "add" ? "(Optional)" : ""}
                  </label>

                  <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-4 text-center cursor-pointer relative bg-slate-50/50 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />

                    {imagePreview ? (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                          <div className="bg-white text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm">
                            <p>Click to Change Photo</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-5 space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
                          <Upload size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          Choose Service Photo
                        </p>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Service Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Knotless Braids, Medical Consultation, Wheel Alignment"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      step={5}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Price / Fee (NGN)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Details about what is included in this session..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input text-sm py-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-sm"
                  >
                    {submitting
                      ? "Saving changes..."
                      : modalMode === "edit"
                        ? "Update Service"
                        : "Create Service"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Service Confirmation Modal */}
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
                    Delete "{deleteTarget.name}"?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to permanently remove this service
                    from your menu?
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
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
