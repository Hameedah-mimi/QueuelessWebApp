import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Star,
  ChevronLeft,
  ThumbsUp,
  ShieldCheck,
  MapPin,
  PenSquare,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80";

export default function Reviews() {
  const { orgId } = useParams();

  const [org, setOrg] = useState(null);
  const [reviewList, setReviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [selectedStar, setSelectedStar] = useState("all");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [search, setSearch] = useState("");
  const [helpfulIds, setHelpfulIds] = useState({});

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviewsData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [orgRes, revRes] = await Promise.allSettled([
          api.get(`/api/v1/organizations/${orgId}/`),
          api.get(`/api/v1/reviews/?organization=${orgId}`),
        ]);

        if (orgRes.status === "fulfilled") {
          const d = orgRes.value.data;
          setOrg({
            id: d.id,
            name: d.name || "Service Venue",
            location: d.location || d.address || "Lagos, Nigeria",
            rating: parseFloat(d.rating || d.average_rating || 5.0),
            reviewsCount: parseInt(d.reviews || d.review_count || 0, 10),
            image: d.image || d.avatar_url || null,
          });
        } else {
          throw new Error("Organization not found");
        }

        if (revRes.status === "fulfilled") {
          const raw = Array.isArray(revRes.value.data)
            ? revRes.value.data
            : revRes.value.data?.results || [];
          const parsed = raw.map((r) => ({
            id: r.id,
            name:
              r.user_name ||
              r.customer_name ||
              r.user?.full_name ||
              "Verified Member",
            date: r.created_at
              ? new Date(r.created_at).toLocaleDateString()
              : r.date || "Recently",
            rating: parseInt(r.rating || 5, 10),
            text: r.comment || r.text || "",
            helpful: parseInt(r.helpful_count || 0, 10),
          }));
          setReviewList(parsed);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setError("Could not retrieve reviews from server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setModalError(null);
    setFeedback(null);
    try {
      const payload = {
        organization: orgId,
        rating: newRating,
        comment: newComment.trim(),
      };

      const res = await api.post("/api/v1/reviews/", payload);
      const created = {
        id: res.data?.id || `rev-${Date.now()}`,
        name: res.data?.user_name || "You",
        date: "Just now",
        rating: newRating,
        text: newComment.trim(),
        helpful: 0,
      };

      setReviewList((prev) => [created, ...prev]);
      setNewComment("");
      setNewRating(5);
      setShowWriteModal(false);
      setFeedback({
        type: "success",
        message: "Review published successfully.",
      });
    } catch (err) {
      console.error("Failed to post review:", err);
      setModalError(
        err.response?.data?.detail ||
          "Could not submit review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHelpful = (id) => {
    setHelpfulIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const bars = useMemo(() => {
    const total = reviewList.length;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviewList.filter((r) => r.rating === stars).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stars, count, pct };
    });
  }, [reviewList]);

  const query = search.trim().toLowerCase();
  const filteredReviews = reviewList.filter((r) => {
    const matchesStar =
      selectedStar === "all" || r.rating === parseInt(selectedStar, 10);
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      r.text.toLowerCase().includes(query);
    return matchesStar && matchesSearch;
  });

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
            Loading customer reviews...
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
              {error || "This organization does not exist."}
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
        {/* NAVIGATION & HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              to={`/customer/org/${org.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition"
            >
              <ChevronLeft size={16} />
              Back to {org.name}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Reviews & Ratings
            </h1>
            <p className="text-sm text-slate-500">
              Verified feedback from customers for {org.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchReviewsData(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-teal-600" : ""}
              />
              <p>{refreshing ? "Syncing..." : "Sync"}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setShowWriteModal(true);
              }}
              className="btn-primary px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <PenSquare size={15} />
              Write a Review
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-4 text-xs font-semibold text-emerald-800"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
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

        {/* 2-COLUMN DESKTOP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="relative h-36 w-full bg-[#102A43]">
                <img
                  src={org.image || FALLBACK_VENUE_IMAGE}
                  alt={org.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/85 via-[#102A43]/35 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white space-y-0.5">
                  <h3 className="font-black text-base truncate">{org.name}</h3>
                  <div className="text-xs text-slate-200 flex items-center gap-1.5">
                    <MapPin size={12} className="text-teal-300 shrink-0" />
                    <p className="truncate">{org.location}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-5">
                  <div className="text-center p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 shrink-0">
                    <p className="text-4xl font-black text-slate-900">
                      {org.rating.toFixed(1)}
                    </p>
                    <div className="flex gap-0.5 justify-center mt-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < Math.round(org.rating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                      Out of 5
                    </p>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {bars.map((b) => (
                      <button
                        key={b.stars}
                        type="button"
                        onClick={() =>
                          setSelectedStar(
                            selectedStar === String(b.stars)
                              ? "all"
                              : String(b.stars),
                          )
                        }
                        className={`w-full flex items-center gap-2 text-xs py-0.5 rounded-lg transition ${
                          selectedStar === String(b.stars)
                            ? "font-bold text-teal-700 bg-teal-50 px-1.5"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <div className="w-7 flex items-center justify-end gap-0.5 font-semibold shrink-0">
                          <p>{b.stars}</p>
                          <Star
                            size={10}
                            className="text-amber-400 fill-amber-400"
                          />
                        </div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${b.pct}%` }}
                          />
                        </div>
                        <p className="w-8 text-slate-400 text-right text-[11px] shrink-0">
                          {b.pct}%
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <img
                      src="/queless.png"
                      alt="QueueLess"
                      className="h-4 w-auto"
                    />
                    <p>Total Verified Reviews</p>
                  </div>
                  <p className="text-slate-900 font-black">
                    {reviewList.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Review Assurance */}
            <div className="rounded-3xl p-5 bg-emerald-50/60 border border-emerald-100 shadow-sm flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="text-emerald-600 shrink-0 mt-0.5"
              />
              <div className="text-xs text-slate-600 leading-relaxed space-y-0.5">
                <p className="text-slate-900 font-bold">Genuine Reviews</p>
                <p>
                  Reviews are submitted by registered QueueLess users with
                  verified visits.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-5">
            {/* Filter & Search Bar */}
            <div className="rounded-2xl p-3 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {["all", "5", "4", "3", "2", "1"].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStar(star)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedStar === star
                        ? "bg-[#102A43] text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {star === "all" ? "All Reviews" : `${star} Stars`}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Filter by comment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 py-2 text-xs w-full"
                />
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.map((r, idx) => {
                const isHelpful = Boolean(helpfulIds[r.id]);
                const helpfulCount = r.helpful + (isHelpful ? 1 : 0);

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(idx * 0.04, 0.2),
                    }}
                    className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm hover:border-teal-300 transition space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 font-black flex items-center justify-center text-sm border border-teal-100">
                          {(r.name || "U")[0].toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {r.name}
                            </h4>
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={10} />
                              <p>Verified</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">{r.date}</p>
                        </div>
                      </div>

                      <div className="flex gap-0.5 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-100 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i < r.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {r.text}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <p>Verified Customer Visit</p>

                      <button
                        type="button"
                        onClick={() => toggleHelpful(r.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-semibold ${
                          isHelpful
                            ? "bg-teal-50 text-teal-700"
                            : "hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <ThumbsUp size={13} />
                        <p>Helpful ({helpfulCount})</p>
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {filteredReviews.length === 0 && (
                <div className="rounded-3xl p-12 text-center border border-dashed border-slate-200 bg-white space-y-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-9 w-auto mx-auto opacity-80"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Star size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      No reviews found
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {search || selectedStar !== "all"
                        ? "No reviews match your filter. Try resetting your search."
                        : "No reviews have been posted for this business yet. Be the first to write one."}
                    </p>
                  </div>
                  {(search || selectedStar !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStar("all");
                        setSearch("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2 font-bold transition"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Write Review Modal */}
      <AnimatePresence>
        {showWriteModal && (
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PenSquare size={17} className="text-teal-600" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Review {org.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="text-slate-400 hover:text-slate-700 transition"
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

              <form onSubmit={handlePostReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewRating(num)}
                        className="p-1 hover:scale-110 transition"
                        aria-label={`Rate ${num} stars`}
                      >
                        <Star
                          size={26}
                          className={
                            num <= newRating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }
                        />
                      </button>
                    ))}
                    <p className="text-xs font-bold text-slate-700 ml-2">
                      {newRating} / 5 Stars
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Feedback
                  </label>
                  <textarea
                    rows={4}
                    className="input py-2.5 text-sm w-full"
                    placeholder="Share details about the specialist, wait time, and service quality..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-sm"
                  >
                    {submitting ? "Publishing..." : "Submit Review"}
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
