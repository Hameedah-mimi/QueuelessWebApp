import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Star,
  MapPin,
  Clock,
  ChevronLeft,
  Phone,
  ShieldCheck,
  ArrowRight,
  Share2,
  Heart,
  Zap,
  CalendarCheck,
  AlertCircle,
  MessageCircle,
  Flag,
  Check,
  X,
} from "lucide-react";

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1500&q=85";

export default function OrgProfile() {
  const { orgId } = useParams();
  const navigate = useNavigate();

  const [org, setOrg] = useState(null);
  const [services, setServices] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const handleStartChat = async () => {
    setChatStarting(true);
    setActionError(null);
    try {
      await api.post("/api/v1/chat/conversations/start/", {
        organization_id: orgId,
      });
      navigate("/messages");
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          "Unable to start a conversation with this organization.",
      );
    } finally {
      setChatStarting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Could not copy link to clipboard.");
    }
  };

  const fetchOrgDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orgRes, svcRes, apptRes] = await Promise.allSettled([
        api.get(`/api/v1/organizations/${orgId}/`),
        api.get(`/api/v1/services/?organization=${orgId}`),
        api.get(`/api/v1/appointments/?organization=${orgId}`),
      ]);

      if (orgRes.status === "fulfilled") {
        const d = orgRes.value.data;
        setOrg({
          id: d.id,
          name: d.name || "Business Profile",
          category: d.category || "Professional Service",
          location: d.location || d.address || "Lagos, Nigeria",
          distance: d.distance || "Near you",
          rating: parseFloat(d.rating || d.average_rating || 5.0),
          reviews: parseInt(d.reviews || d.review_count || 0, 10),
          description: d.description || "",
          hours:
            d.hours ||
            d.opening_hours ||
            "Monday - Saturday: 9:00 AM - 8:00 PM",
          phone: d.phone || d.contact_phone || "+234 812 345 6789",
          image: d.image || d.avatar_url || null,
          gallery: d.gallery || [],
          open: d.open !== undefined ? d.open : true,
          closes: d.closes || "8:00 PM",
        });
      } else {
        throw new Error("Organization not found");
      }

      if (svcRes.status === "fulfilled") {
        const rawSvc = Array.isArray(svcRes.value.data)
          ? svcRes.value.data
          : svcRes.value.data?.results || [];
        setServices(rawSvc);
      }

      if (apptRes.status === "fulfilled") {
        const rawAppts = Array.isArray(apptRes.value.data)
          ? apptRes.value.data
          : apptRes.value.data?.results || [];
        const waiting = rawAppts.filter((a) => {
          const s = (a.status || "").toLowerCase();
          return s === "pending" || s === "in_progress";
        }).length;
        setQueueCount(waiting);
      }
    } catch (err) {
      console.error("Failed to load organization:", err);
      setError("Could not retrieve business details from the server.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

  const categories = [
    "All",
    ...new Set(services.map((s) => s.category).filter(Boolean)),
  ];

  const filteredServices =
    activeCategory === "All"
      ? services
      : services.filter((s) => s.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RoleNavbar />
        <main className="lg:ml-64 min-h-[75vh] flex flex-col items-center justify-center p-6 gap-4">
          <img
            src="/queless.png"
            alt="QueueLess"
            className="h-12 w-auto animate-pulse"
          />
          <p className="text-xs font-medium text-slate-400">
            Loading business profile...
          </p>
        </main>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RoleNavbar />
        <main className="lg:ml-64 min-h-[75vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Organization Not Found
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "This organization does not exist in the database."}
            </p>
            <Link
              to="/customer/explore"
              className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold inline-block"
            >
              Back to Explore
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HERO BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-[#102A43]"
        >
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <img
              src={org.image || FALLBACK_VENUE_IMAGE}
              alt={org.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/90 via-[#102A43]/40 to-[#102A43]/20" />

            <Link
              to="/customer/explore"
              className="absolute top-5 left-5 w-11 h-11 rounded-2xl bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center shadow-md transition backdrop-blur-md"
              title="Back to explore"
            >
              <ChevronLeft size={22} />
            </Link>

            <div className="absolute top-5 right-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className="w-11 h-11 rounded-2xl bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center shadow-md transition backdrop-blur-md"
                aria-label="Save favorite"
              >
                <Heart
                  size={20}
                  className={
                    liked ? "text-rose-500 fill-rose-500" : "text-slate-700"
                  }
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="h-11 px-3.5 rounded-2xl bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center gap-1.5 shadow-md transition backdrop-blur-md text-xs font-bold"
                title="Share business"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <p className="text-emerald-700">Copied</p>
                  </>
                ) : (
                  <Share2 size={18} className="text-slate-700" />
                )}
              </button>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  {org.category}
                </p>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {org.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-center gap-1 font-bold text-white">
                    <Star size={15} className="text-amber-400 fill-amber-400" />
                    <p>{org.rating.toFixed(1)}</p>
                    {org.reviews > 0 && (
                      <p className="text-slate-300 font-normal">
                        ({org.reviews} verified reviews)
                      </p>
                    )}
                  </div>
                  <p className="text-slate-400">·</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-teal-300 shrink-0" />
                    <p>{org.location}</p>
                  </div>
                  <p className="text-slate-400">·</p>
                  <div className="inline-flex items-center gap-1.5 font-bold">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        org.open ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <p
                      className={
                        org.open ? "text-emerald-300" : "text-rose-300"
                      }
                    >
                      {org.open ? `Open until ${org.closes}` : "Closed"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  disabled={chatStarting}
                  onClick={handleStartChat}
                  className="py-3 px-4 rounded-xl bg-white/95 hover:bg-white text-slate-800 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm transition"
                >
                  <MessageCircle size={17} />
                  <p>{chatStarting ? "Opening..." : "Message"}</p>
                </button>

                <Link
                  to={`/report?type=organization&id=${org.id}&name=${encodeURIComponent(org.name)}`}
                  className="py-3 px-4 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm transition"
                  title="Report this organization"
                >
                  <Flag size={16} />
                  Report
                </Link>

                <Link
                  to={`/customer/org/${org.id}/book`}
                  className="btn-primary py-3 px-5 rounded-xl text-xs sm:text-sm font-bold shadow-md inline-flex items-center gap-2"
                >
                  <CalendarCheck size={17} />
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inline Action Error Banner */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-4 text-xs font-semibold text-rose-800"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <p>{actionError}</p>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-COLUMN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-3">
              <h2 className="text-lg font-black text-slate-900">
                About {org.name}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {org.description ||
                  `${org.name} provides professional services with experienced specialists, high hygiene standards, and live queue tracking.`}
              </p>
            </div>

            {org.gallery && org.gallery.length > 0 && (
              <div className="rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-900">
                  Photos & Atmosphere
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {org.gallery.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group"
                    >
                      <img
                        src={src}
                        alt={`${org.name} gallery ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Menu */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Service Menu
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a service to book your appointment
                  </p>
                </div>

                {categories.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          activeCategory === cat
                            ? "bg-[#102A43] text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-teal-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((svc, idx) => (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(idx * 0.04, 0.2),
                    }}
                    className="rounded-3xl p-5 border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition flex flex-col justify-between group shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition">
                          {svc.name}
                        </h4>
                        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                          <p>
                            {svc.duration || svc.duration_minutes || 45} mins
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {svc.description ||
                          "Professional service tailored to your preference."}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Price
                        </p>
                        <p className="text-lg font-black text-teal-600">
                          {formatNaira(svc.price)}
                        </p>
                      </div>

                      <Link
                        to={`/customer/org/${org.id}/book?service=${svc.id}`}
                        className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Book Slot
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </motion.div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="col-span-full rounded-3xl p-10 text-center text-slate-400 text-xs bg-white border border-dashed border-slate-200">
                    No services registered under "{activeCategory}".
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-3xl p-6 border border-teal-200 bg-gradient-to-br from-white via-white to-teal-50/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Zap size={15} className="text-teal-600" />
                  <p>Virtual Queue</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Current Walk-in Line
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-black text-slate-900">
                    {queueCount} {queueCount === 1 ? "Person" : "People"}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    waiting in line
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Est. wait:{" "}
                  <strong className="text-teal-600">
                    ~{queueCount * 15} mins
                  </strong>
                </p>
              </div>

              <Link
                to={`/customer/queue?org=${org.id}`}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                Join Live Queue Remotely
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  Business Information
                </h3>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-5 w-auto"
                />
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 text-slate-600">
                  <MapPin size={18} className="text-teal-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">Address</p>
                    <p>{org.location}</p>
                    <p className="text-[11px] text-slate-400">{org.distance}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-600">
                  <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">Opening Hours</p>
                    <p>{org.hours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-600">
                  <Phone size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">Phone Support</p>
                    <p>{org.phone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <p>
                  Verified QueueLess partner with instant booking confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
