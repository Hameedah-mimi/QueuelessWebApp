import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  UserRound,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import api from "../../api/client";

const unwrap = (data) =>
  Array.isArray(data) ? data : data?.results || data?.conversations || [];

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data } = await api.get("/api/v1/chat/conversations/");
      const items = unwrap(data);
      setConversations(items);
      setSelected((current) => current || items[0] || null);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Your messages could not be loaded. Please check that the chat API is enabled on the backend.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversation) => {
    if (!conversation) return;
    const id = conversation.id || conversation.pk;
    try {
      const { data } = await api.get(
        `/api/v1/chat/conversations/${id}/messages/`,
      );
      setMessages(unwrap(data?.messages ?? data));
      setError("");
    } catch (err) {
      setMessages([]);
      setError(
        err.response?.data?.detail ||
          "This conversation's messages could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages(selected);
  }, [selected, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (item) => {
    setSelected(item);
    setMobileShowThread(true);
  };

  const send = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selected) return;
    setSending(true);
    try {
      const id = selected.id || selected.pk;
      const { data } = await api.post(
        `/api/v1/chat/conversations/${id}/messages/`,
        { content: draft.trim(), message: draft.trim() },
      );
      setMessages((old) => [...old, data]);
      setDraft("");
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Message could not be sent. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((item) =>
    (item.name || item.title || item.organization_name || "Conversation")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const selectedName =
    selected?.name ||
    selected?.title ||
    selected?.organization_name ||
    "Conversation";

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              to="/customer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight">
              Messages
            </h1>
            <p className="text-sm text-slate-500">
              Keep appointment conversations and service questions in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadConversations(true);
              if (selected) loadMessages(selected);
            }}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-4 py-2.5 font-bold inline-flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            <p>{refreshing ? "Syncing..." : "Sync"}</p>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 flex items-center gap-2.5"
          >
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Chat Container */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid lg:grid-cols-[330px_1fr] min-h-[600px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
        >
          {/* Conversations Sidebar */}
          <aside
            className={`border-r border-slate-100 flex flex-col ${
              mobileShowThread ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-5 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-900 text-sm">
                  Conversations
                </h2>
                <img
                  src="/queless.png"
                  alt="QueueLess"
                  className="h-4 w-auto"
                />
              </div>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  className="input pl-10 py-2.5 text-xs"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations..."
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-8 w-auto animate-pulse"
                  />
                  <p className="text-xs text-slate-400">
                    Loading conversations...
                  </p>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((item) => {
                  const id = item.id || item.pk;
                  const active = (selected?.id || selected?.pk) === id;
                  const title =
                    item.name ||
                    item.title ||
                    item.organization_name ||
                    "Conversation";
                  const preview =
                    item.last_message ||
                    item.last_message_text ||
                    "Open conversation";

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectConversation(item)}
                      className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-50 transition ${
                        active ? "bg-teal-50/70 border-l-4 border-teal-600" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <UserRound size={18} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {preview}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-7 w-auto mx-auto opacity-75"
                  />
                  <MessageCircle size={26} className="mx-auto text-slate-300" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-800">
                      No conversations yet
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Messages will appear here when you contact a business or
                      customer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Message Thread */}
          <section
            className={`flex flex-col min-h-[560px] ${
              mobileShowThread ? "flex" : "hidden lg:flex"
            }`}
          >
            {selected ? (
              <>
                <header className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileShowThread(false)}
                      className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <UserRound size={18} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-900 text-sm truncate">
                        {selectedName}
                      </h2>
                      <p className="text-xs text-slate-400">
                        QueueLess direct messaging
                      </p>
                    </div>
                  </div>
                </header>

                <div className="flex-1 p-5 sm:p-6 space-y-3 overflow-y-auto bg-slate-50/70">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const mine = Boolean(
                        message.is_mine || message.is_sender,
                      );
                      return (
                        <div
                          key={message.id || index}
                          className={`flex ${
                            mine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                              mine
                                ? "bg-teal-600 text-white rounded-br-md"
                                : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                            }`}
                          >
                            <p>
                              {message.content ||
                                message.message ||
                                message.body}
                            </p>
                            {message.created_at && (
                              <p
                                className={`text-[10px] mt-1.5 ${
                                  mine ? "text-teal-100" : "text-slate-400"
                                }`}
                              >
                                {new Date(message.created_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full min-h-64 flex items-center justify-center text-center">
                      <div className="space-y-2">
                        <MessageCircle
                          size={30}
                          className="mx-auto text-slate-300"
                        />
                        <p className="text-sm font-medium text-slate-500">
                          Your conversation starts here.
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={send}
                  className="p-4 border-t border-slate-100 bg-white flex items-center gap-2.5"
                >
                  <input
                    className="input flex-1 text-sm"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message..."
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="btn-primary px-5 py-3 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Send size={15} />
                    <p className="hidden sm:block">Send</p>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-3">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-8 w-auto mx-auto opacity-80"
                  />
                  <MessageCircle size={34} className="mx-auto text-slate-300" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">
                      Select a conversation
                    </p>
                    <p className="text-xs text-slate-500">
                      Choose a conversation from the left to view messages.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </motion.section>
      </main>
    </div>
  );
}
