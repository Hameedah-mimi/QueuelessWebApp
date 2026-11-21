import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  MessageCircle,
  Clock3,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import PublicNavbar from "../../components/layout/PublicNavbar";
import api from "../../api/client";

const SUPPORT_IMAGE =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({
    busy: false,
    error: "",
    success: "",
  });

  const update = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ busy: true, error: "", success: "" });
    try {
      await api.post("/api/v1/contact/", form);
      setStatus({
        busy: false,
        error: "",
        success:
          "Your message has been sent. The QueueLess team will get back to you shortly.",
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        busy: false,
        error:
          error.response?.data?.detail ||
          "We couldn't submit your message right now. Please try again later.",
        success: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition"
        >
          <ArrowLeft size={16} />
          Back home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Support Info & Visual */}
          <section className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-[.18em] text-teal-700 uppercase">
                Support Center
              </p>
              <h1 className="text-3xl sm:text-5xl font-black text-[#102A43] tracking-tight leading-tight">
                Talk to the QueueLess team.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Questions about bookings, managing your organization, or using
                QueueLess? Send us a message and tell us how we can help.
              </p>
            </div>

            <div className="relative h-48 rounded-3xl overflow-hidden bg-[#102A43] shadow-sm border border-slate-200">
              <img
                src={SUPPORT_IMAGE}
                alt="QueueLess support team"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/80 via-[#102A43]/30 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
                <p className="text-xs font-bold text-slate-100">
                  Dedicated Customer & Business Care
                </p>
                <div className="bg-white/95 rounded-xl px-2.5 py-1">
                  <img
                    src="/queless.png"
                    alt="QueueLess"
                    className="h-4 w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
                <div className="rounded-xl bg-teal-50 text-teal-700 p-3 shrink-0">
                  <Mail size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Email support
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Use the contact form and our team will respond directly by
                    email.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
                <div className="rounded-xl bg-teal-50 text-teal-700 p-3 shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Appointment help
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    For a specific booking, include its reference number in your
                    message.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
                <div className="rounded-xl bg-teal-50 text-teal-700 p-3 shrink-0">
                  <Clock3 size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Response time
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    We aim to respond as quickly as our support team is
                    available.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Form Card */}
          <section className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-9 space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Send us a message
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Complete the form below and we'll follow up shortly.
                </p>
              </div>
              <img
                src="/queless.png"
                alt="QueueLess"
                className="h-6 w-auto shrink-0"
              />
            </div>

            {status.error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5"
              >
                <AlertCircle
                  size={17}
                  className="text-rose-600 shrink-0 mt-0.5"
                />
                <p>{status.error}</p>
              </div>
            )}

            {status.success && (
              <div
                role="status"
                className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-700 flex items-start gap-2.5"
              >
                <CheckCircle2
                  size={17}
                  className="text-emerald-600 shrink-0 mt-0.5"
                />
                <p>{status.success}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-slate-700">
                  Your name
                  <input
                    className="input mt-1.5"
                    required
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Full name"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Email address
                  <input
                    className="input mt-1.5"
                    required
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-700">
                Subject
                <input
                  className="input mt-1.5"
                  required
                  value={form.subject}
                  onChange={update("subject")}
                  placeholder="What do you need help with?"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Message
                <textarea
                  className="input mt-1.5 min-h-36 resize-y py-3"
                  required
                  minLength={10}
                  value={form.message}
                  onChange={update("message")}
                  placeholder="Write your message here..."
                />
              </label>

              <button
                type="submit"
                disabled={status.busy}
                className="btn-primary w-full py-3.5 rounded-xl font-bold inline-flex items-center justify-center gap-2 shadow-sm"
              >
                {status.busy ? "Sending..." : "Send message"}
                <Send size={16} />
              </button>
            </form>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
