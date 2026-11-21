import { useState } from "react";
import { motion } from "framer-motion";
import RoleNavbar from "../../components/layout/RoleNavbar";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Database,
  Shield,
} from "lucide-react";

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [platformFee, setPlatformFee] = useState("5.0");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <SettingsIcon className="text-teal-600" size={24} />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Platform Configuration
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Global system settings, commission rate parameters, and API
              options.
            </p>
          </div>
          <img
            src="/queless.png"
            alt="QueueLess"
            className="hidden sm:block h-6 w-auto"
          />
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSave}
          className="space-y-6"
        >
          <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database size={17} className="text-teal-600" />
              <h3 className="text-base font-black text-slate-900">
                Financial & Commission Rules
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Platform Take-rate (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Billing Currency
                </label>
                <input
                  type="text"
                  disabled
                  value="NGN (Nigerian Naira)"
                  className="input text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield size={17} className="text-teal-600" />
              <h3 className="text-base font-black text-slate-900">
                System Operations
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">
                  Maintenance Mode
                </p>
                <p className="text-xs text-slate-500">
                  Temporarily suspend queue ticket creation for database
                  maintenance.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            {saved ? (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-full inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <p>Changes saved successfully.</p>
              </div>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="btn-primary px-8 py-3 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <Save size={16} />
              Save Configuration
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
