import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Search,
  Star,
  MapPin,
  X,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Navigation,
  Stethoscope,
  Wrench,
  Scissors,
  Sparkles,
  Building2,
  Layers,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Services", icon: Layers, keywords: [] },
  {
    id: "clinic",
    label: "Medical & Clinics",
    icon: Stethoscope,
    keywords: ["clinic", "medical", "health", "hospital", "dental"],
  },
  {
    id: "auto",
    label: "Auto & Repairs",
    icon: Wrench,
    keywords: ["auto", "repair", "mechanic", "car", "garage"],
  },
  {
    id: "salon",
    label: "Salons & Grooming",
    icon: Scissors,
    keywords: ["salon", "barber", "grooming", "hair", "beauty"],
  },
  {
    id: "spa",
    label: "Spas & Wellness",
    icon: Sparkles,
    keywords: ["spa", "wellness", "massage", "skincare"],
  },
  {
    id: "consulting",
    label: "Legal & Consulting",
    icon: Building2,
    keywords: ["consulting", "legal", "law", "agency", "finance"],
  },
];

const FALLBACK_IMAGES = {
  clinic:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80",
  auto: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1000&q=80",
  salon:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
  consulting:
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80",
  default:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80",
};

function getFallbackImage(category = "") {
  const c = category.toLowerCase();
  const match = CATEGORIES.find(
    (cat) => cat.id !== "all" && cat.keywords.some((kw) => c.includes(kw)),
  );
  return FALLBACK_IMAGES[match?.id || "default"];
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return null;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export default function Explore() {
  const [params] = useSearchParams();
  const initialCategory = params.get("category") || "all";
  const initialQuery = params.get("q") || "";

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [openOnly, setOpenOnly] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(true);

  const fetchOrganizations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/organizations/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const parsed = raw.map((org) => ({
        id: org.id,
        name: org.name || "Service Venue",
        category: org.category || "Professional Service",
        location: org.location || org.address || "Location Not Specified",
        latitude: org.latitude != null ? parseFloat(org.latitude) : null,
        longitude: org.longitude != null ? parseFloat(org.longitude) : null,
        rating: parseFloat(org.rating || org.average_rating || 5.0),
        reviews: parseInt(org.reviews || org.review_count || 0, 10),
        image: org.image || org.avatar_url || null,
        open: org.open !== undefined ? org.open : true,
        closes: org.closes || "8:00 PM",
      }));

      setOrganizations(parsed);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError("Could not retrieve service venues from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    setLocating(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
        setSortByNearest(true);
      },
      (err) => {
        console.warn("Geolocation denied or timed out:", err);
        setLocating(false);
        setLocationDenied(true);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const results = useMemo(() => {
    let list = organizations.map((o) => {
      const distanceKm = userCoords
        ? calculateDistanceKm(
            userCoords.latitude,
            userCoords.longitude,
            o.latitude,
            o.longitude,
          )
        : null;

      return {
        ...o,
        distanceKm,
        distanceText:
          distanceKm !== null ? `${distanceKm} km away` : "Available",
      };
    });

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== "all") {
      const activeCat = CATEGORIES.find((c) => c.id === selectedCategory);
      const keywords = activeCat?.keywords || [selectedCategory];
      list = list.filter((o) => {
        const cat = o.category.toLowerCase();
        return keywords.some((kw) => cat.includes(kw));
      });
    }

    if (openOnly) {
      list = list.filter((o) => o.open);
    }

    if (sortByNearest && userCoords) {
      list.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [
    organizations,
    query,
    selectedCategory,
    openOnly,
    userCoords,
    sortByNearest,
  ]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setOpenOnly(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Services Near You
            </h1>
            <p className="text-sm text-slate-500">
              Find clinics, auto mechanics, salons, and consultancies with live
              queue tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={locating}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border shadow-sm ${
                userCoords
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Navigation
                size={13}
                className={
                  locating ? "animate-spin text-teal-600" : "text-teal-600"
                }
              />
              <p>
                {userCoords
                  ? "Location Active"
                  : locating
                    ? "Locating..."
                    : "Detect Location"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => fetchOrganizations(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition inline-flex items-center gap-1.5"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin text-teal-600" : ""}
              />
              <p>{refreshing ? "Syncing..." : "Sync"}</p>
            </button>

            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 font-bold shadow-sm">
              <p>{loading ? "..." : `${results.length} venues`}</p>
            </div>
          </div>
        </div>

        {/* Error & Location Notices */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchOrganizations()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {locationDenied && !userCoords && (
          <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-4 shadow-sm">
            <p>
              Location access is disabled. Showing top-rated venues across all
              areas.
            </p>
            <button
              type="button"
              onClick={requestUserLocation}
              className="text-teal-700 font-bold hover:underline shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Search & Quick Filters */}
        <div className="rounded-3xl p-4 border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                className="input pl-10 pr-10 text-sm"
                placeholder="Search by business name, specialty, or area..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenOnly((prev) => !prev)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                  openOnly
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Clock size={14} />
                <p>Open Now</p>
              </button>

              <button
                type="button"
                onClick={() => setSortByNearest((prev) => !prev)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition inline-flex items-center gap-1.5"
              >
                <SlidersHorizontal size={14} className="text-teal-600" />
                <p>
                  Sort: {sortByNearest && userCoords ? "Nearest" : "Top Rated"}
                </p>
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#102A43] text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-white"
                  }`}
                >
                  <Icon
                    size={14}
                    className={isSelected ? "text-teal-300" : "text-slate-500"}
                  />
                  <p>{cat.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-10 w-auto animate-pulse"
            />
            <p className="text-xs font-medium text-slate-400">
              Finding verified businesses near you...
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((org, idx) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(idx * 0.04, 0.25),
                }}
              >
                <Link
                  to={`/customer/org/${org.id}`}
                  className="rounded-3xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition duration-200 group h-full shadow-sm"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative h-44 w-full bg-[#102A43] overflow-hidden">
                    <img
                      src={org.image || getFallbackImage(org.category)}
                      alt={org.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/85 via-[#102A43]/25 to-transparent" />

                    {/* Open Status */}
                    <div className="absolute top-3 left-3">
                      <div
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm ${
                          org.open
                            ? "bg-emerald-500/95 text-white"
                            : "bg-slate-900/80 text-slate-200"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            org.open ? "bg-white" : "bg-slate-400"
                          }`}
                        />
                        <p>{org.open ? `Open · ${org.closes}` : "Closed"}</p>
                      </div>
                    </div>

                    {/* Proximity Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                      <Navigation size={11} className="text-teal-600" />
                      <p>{org.distanceText}</p>
                    </div>

                    {/* Bottom Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                        {org.category}
                      </p>
                      <h3 className="text-base font-black truncate">
                        {org.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin size={14} className="text-teal-600 shrink-0" />
                        <p className="truncate">{org.location}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Star
                          size={13}
                          className="text-amber-400 fill-amber-400 shrink-0"
                        />
                        <p className="font-bold text-slate-800">
                          {org.rating.toFixed(1)}
                        </p>
                        <p>({org.reviews || 0} reviews)</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p>Virtual Queue Active</p>
                      </div>
                      <div className="text-xs font-bold text-teal-700 group-hover:text-teal-800 inline-flex items-center gap-1">
                        <p>View & Book</p>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center border border-dashed border-slate-200 bg-white space-y-4">
            <img
              src="/queless.png"
              alt="QueueLess"
              className="h-9 w-auto mx-auto opacity-80"
            />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                No businesses found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                We couldn't find any service venues matching your current
                filters. Try clearing your filters or searching another area.
              </p>
            </div>
            {(query || selectedCategory !== "all" || openOnly) && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
