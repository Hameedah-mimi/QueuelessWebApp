import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";
import {
  Bell,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Sliders,
  Mail,
  Smartphone,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const getNotificationMeta = (title = "", body = "", type = "") => {
  const text = `${title} ${body} ${type}`.toLowerCase();

  if (text.includes("appointment") || text.includes("booking")) {
    return {
      icon: Calendar,
      color: "text-teal-600 bg-teal-50 border-teal-100",
      type: "booking",
    };
  }
  if (
    text.includes("queue") ||
    text.includes("line") ||
    text.includes("turn") ||
    text.includes("ticket")
  ) {
    return {
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      type: "queue",
    };
  }
  if (
    text.includes("security") ||
    text.includes("password") ||
    text.includes("login") ||
    text.includes("auth")
  ) {
    return {
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      type: "security",
    };
  }
  return {
    icon: Sparkles,
    color: "text-blue-600 bg-blue-50 border-blue-100",
    type: "promo",
  };
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const [channels, setChannels] = useState({
    sms: true,
    email: true,
    push: false,
  });

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/notifications/");
      const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const parsed = raw.map((n) => ({
        id: n.id,
        title: n.title || "Platform Notification",
        body: n.body || n.message || "",
        unread: n.unread !== undefined ? n.unread : !n.is_read,
        time: n.created_at
          ? new Date(n.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : n.time || "Recently",
        type: n.type || n.notification_type || "",
      }));

      setItems(parsed);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Could not retrieve notifications from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/`, {
        unread: false,
        is_read: true,
      });
    } catch {
      // Optimistic update
    }
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  const markAllRead = async () => {
    try {
      await api.post("/api/v1/notifications/read-all/");
    } catch {
      // Optimistic update
    }
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/v1/notifications/${id}/`);
    } catch {
      // Optimistic update
    }
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleChannel = (channelKey) => {
    setChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  };

  const unreadCount = items.filter((n) => n.unread).length;

  const filteredList = items.filter((n) => {
    if (filter === "unread") return n.unread;
    if (filter === "booking") {
      const meta = getNotificationMeta(n.title, n.body, n.type);
      return meta.type === "booking";
    }
    if (filter === "queue") {
      const meta = getNotificationMeta(n.title, n.body, n.type);
      return meta.type === "queue";
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <div className="text-xs px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                  <p>{unreadCount} new</p>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Live updates on appointments, queue movement, and alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-teal-600" : ""}
              />
              <p>{refreshing ? "Syncing..." : "Sync"}</p>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-xl border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-200 text-slate-700 hover:text-teal-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-1.5 shadow-sm transition"
              >
                <CheckCheck size={16} />
                <p>Mark all as read</p>
              </button>
            )}
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchNotifications()}
              className="underline font-bold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2-COLUMN DESKTOP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS: Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Tabs */}
            <div className="rounded-2xl p-2 border border-slate-200 bg-white shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "All Updates", count: items.length },
                { id: "unread", label: "Unread", count: unreadCount },
                { id: "booking", label: "Bookings" },
                { id: "queue", label: "Queue Status" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    filter === tab.id
                      ? "bg-[#102A43] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <p>{tab.label}</p>
                  {tab.count !== undefined && tab.count > 0 && (
                    <div
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                        filter === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      <p>{tab.count}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-10 w-auto animate-pulse"
                  />
                  <p className="text-xs font-medium text-slate-400">
                    Loading your notifications...
                  </p>
                </div>
              ) : filteredList.length > 0 ? (
                <AnimatePresence initial={false}>
                  {filteredList.map((n) => {
                    const meta = getNotificationMeta(n.title, n.body, n.type);
                    const IconComponent = meta.icon;

                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => n.unread && markAsRead(n.id)}
                        className={`p-5 transition flex items-start gap-4 hover:bg-slate-50/80 group cursor-pointer ${
                          n.unread ? "bg-teal-50/35" : "bg-white"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${meta.color}`}
                        >
                          <IconComponent size={20} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-sm truncate ${
                                n.unread
                                  ? "font-black text-slate-950"
                                  : "font-bold text-slate-800"
                              }`}
                            >
                              {n.title}
                            </h4>

                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-xs text-slate-400 font-medium">
                                {n.time}
                              </p>
                              {n.unread && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0"
                                  title="Unread notification"
                                />
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {n.body}
                          </p>

                          <div className="pt-2 flex items-center justify-between">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              QueueLess Notification
                            </p>

                            <button
                              type="button"
                              onClick={(e) => deleteNotification(n.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 sm:opacity-0 sm:group-hover:opacity-100 transition"
                              aria-label="Delete notification"
                              title="Dismiss notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-9 w-auto mx-auto opacity-80"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Bell size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      All caught up
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      No notifications match your current filter. Booking and
                      queue updates will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Delivery Preferences */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sliders size={17} className="text-teal-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Delivery Channels
                  </h3>
                </div>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-5 w-auto"
                />
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
                    <Smartphone size={16} className="text-slate-400" />
                    <p>SMS Queue Alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel("sms")}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                      channels.sms
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {channels.sms ? "Active" : "Off"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
                    <Mail size={16} className="text-slate-400" />
                    <p>Email Booking Updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel("email")}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                      channels.email
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {channels.email ? "Active" : "Off"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
                    <Bell size={16} className="text-slate-400" />
                    <p>Browser Push Alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel("push")}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                      channels.push
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {channels.push ? "Active" : "Paused"}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 leading-relaxed">
                You will always receive reminders 15 minutes before your
                scheduled appointment time.
              </p>
            </div>

            <div className="rounded-3xl p-5 bg-gradient-to-br from-teal-50/70 via-white to-white border border-teal-100 shadow-sm space-y-1.5">
              <div className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-teal-600" />
                <p>Live Queue Tip</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep alerts active so you can handle errands nearby and return
                only when your ticket is next in line.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
