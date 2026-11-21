import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  ChevronLeft,
  Check,
  Clock,
  MapPin,
  Star,
  ShieldCheck,
  ArrowRight,
  Info,
  AlertCircle,
} from "lucide-react";

const FALLBACK_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=85";

export default function ServiceDetail() {
  const { orgId, serviceId } = useParams();
  const navigate = useNavigate();

  const [svc, setSvc] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatNaira = (amt) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  const fetchServiceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [svcRes, orgRes] = await Promise.allSettled([
        api.get(`/api/v1/services/${serviceId}/`),
        api.get(`/api/v1/organizations/${orgId}/`),
      ]);

      if (svcRes.status === "fulfilled") {
        const s = svcRes.value.data;
        setSvc({
          id: s.id,
          name: s.name || "Specialty Service",
          category: s.category || "Professional Service",
          duration: s.duration || s.duration_minutes || 60,
          price: parseFloat(s.price || 0),
          description: s.description || "",
          includes: s.includes ||
            s.features || [
              "Initial consultation with assigned specialist",
              "Dedicated service session tailored to your booking",
              "Post-session guidance and follow-up recommendations",
              "Sanitized equipment and prepared private workstation",
            ],
          image: s.image || null,
        });
      } else {
        throw new Error("Service not found");
      }

      if (orgRes.status === "fulfilled") {
        const o = orgRes.value.data;
        setOrg({
          id: o.id,
          name: o.name || "Service Venue",
          location: o.location || o.address || "Lagos, Nigeria",
          rating: parseFloat(o.rating || o.average_rating || 5.0),
          reviews: parseInt(o.reviews || o.review_count || 0, 10),
          image: o.image || o.avatar_url || null,
          open: o.open !== undefined ? o.open : true,
        });
      } else {
        setOrg({
          id: orgId,
          name: "Partner Venue",
          location: "Lagos, Nigeria",
          rating: 5.0,
          open: true,
          image: null,
        });
      }
    } catch (err) {
      console.error("Failed to load service detail:", err);
      setError("Could not retrieve service details from server.");
    } finally {
      setLoading(false);
    }
  }, [orgId, serviceId]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

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
            Loading service specifications...
          </p>
        </main>
      </div>
    );
  }

  if (error || !svc) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RoleNavbar />
        <main className="lg:ml-64 min-h-[75vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Service Not Found
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "This service does not exist in the database."}
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const heroPhoto = svc.image || org?.image || FALLBACK_SERVICE_IMAGE;

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* TOP NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 transition"
          >
            <ChevronLeft size={16} />
            Back to {org?.name || "Venue"}
          </button>

          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Service Specification
          </p>
        </div>

        {/* 2-COLUMN DESKTOP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Visual Cover Card */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="relative h-64 sm:h-80 w-full bg-[#102A43]">
                <img
                  src={heroPhoto}
                  alt={svc.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/90 via-[#102A43]/35 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    {svc.category}
                  </p>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                    {svc.name}
                  </h1>
                  <p className="text-slate-200 text-xs sm:text-sm">
                    Offered by{" "}
                    <Link
                      to={`/customer/org/${org?.id || orgId}`}
                      className="text-white font-bold underline hover:text-teal-200"
                    >
                      {org?.name}
                    </Link>
                  </p>
                </div>
              </div>

              {/* Service Quick Specs */}
              <div className="p-6 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <Clock size={19} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Duration
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {svc.duration} Minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck size={19} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Hygiene & Safety
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      Sanitized Station
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Star size={19} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Rating
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {org?.rating?.toFixed(1) || "5.0"} / 5.0
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-3">
              <h2 className="text-lg font-black text-slate-900">
                About this service
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {svc.description ||
                  `Experience a dedicated ${svc.name} session provided by trained professionals at ${org?.name}, tailored to your needs with high standards of quality and comfort.`}
              </p>
            </div>

            {/* What's Included */}
            {svc.includes && svc.includes.length > 0 && (
              <div className="rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-900">
                  What is included in this session
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {svc.includes.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines */}
            <div className="rounded-3xl p-6 border border-teal-100 bg-gradient-to-br from-teal-50/60 via-white to-white shadow-sm flex items-start gap-4">
              <Info size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Preparation & Cancellation Policy
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please arrive 10 minutes prior to your selected start time.
                  Rescheduling and cancellations are free up to 2 hours before
                  the appointment.
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="space-y-6 lg:sticky lg:top-8"
          >
            {/* Checkout Card */}
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Service Price
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <p className="text-3xl font-black text-teal-600">
                      {formatNaira(svc.price)}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      / session
                    </p>
                  </div>
                </div>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-5 w-auto"
                />
              </div>

              <div className="space-y-3 py-4 border-y border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <p>Duration</p>
                  <p className="font-bold text-slate-900">
                    {svc.duration} mins
                  </p>
                </div>
                <div className="flex justify-between text-slate-600">
                  <p>Specialist Selection</p>
                  <p className="font-bold text-teal-600">Choose on Next Step</p>
                </div>
                <div className="flex justify-between text-slate-600">
                  <p>Online Booking Fee</p>
                  <p className="font-bold text-emerald-600 uppercase font-mono">
                    Free
                  </p>
                </div>
              </div>

              <Link
                to={`/customer/org/${org?.id || orgId}/book?service=${svc.id}`}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold shadow-sm inline-flex items-center justify-center gap-2"
              >
                Book This Service
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Venue Snapshot */}
            <div className="rounded-3xl p-5 border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={org?.image || FALLBACK_SERVICE_IMAGE}
                    alt={org?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {org?.name}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-teal-600 shrink-0" />
                    <p className="truncate">
                      {org?.location || "Lagos, Nigeria"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      org?.open ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <p
                    className={org?.open ? "text-emerald-600" : "text-rose-600"}
                  >
                    {org?.open ? "Open Now" : "Closed"}
                  </p>
                </div>
                <Link
                  to={`/customer/org/${org?.id || orgId}`}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
