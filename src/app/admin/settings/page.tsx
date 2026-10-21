"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Settings,
  ShieldCheck,
  CreditCard,
  Truck,
  Bell,
  Save,
  CheckCircle,
  AlertCircle,
  Key,
  Plus,
  Trash2,
} from "lucide-react";
import type { SiteSettings } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [storeName, setStoreName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [studioAddress, setStudioAddress] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [usaOfficeAddress, setUsaOfficeAddress] = useState("");
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("140000");
  const [standardShippingFee, setStandardShippingFee] = useState("250");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        const s = data.settings;
        setSettings(s);
        setStoreName(s.storeName || "Sillhouete");
        setTitle(s.title || "");
        setEmail(s.email || "");
        setPhone(s.phone || "");
        setWhatsapp(s.whatsapp || "");
        setStudioAddress(s.studioAddress || "");
        setOfficeAddress(s.officeAddress || "");
        setUsaOfficeAddress(s.usaOfficeAddress || "");
        setAnnouncements(s.announcements || []);
        setFreeShippingThreshold(s.freeShippingThreshold?.toString() || "140000");
        setStandardShippingFee(s.standardShippingFee?.toString() || "250");
        setStripePublishableKey(s.stripePublishableKey || "");
        setStripeSecretKey(s.stripeSecretKey || "");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    setAnnouncements([...announcements, newAnnouncement.trim()]);
    setNewAnnouncement("");
  };

  const handleRemoveAnnouncement = (index: number) => {
    setAnnouncements(announcements.filter((_, i) => i !== index));
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          title,
          email,
          phone,
          whatsapp,
          studioAddress,
          officeAddress,
          usaOfficeAddress,
          announcements,
          freeShippingThreshold: Number(freeShippingThreshold) || 140000,
          standardShippingFee: Number(standardShippingFee) || 250,
          stripePublishableKey,
          stripeSecretKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordNotice("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");

      setPasswordNotice("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error changing password";
      setPasswordError(msg);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Website Settings</h1>
        <p className="text-sm text-gray-500">
          Configure store details, announcement messages, shipping rules, and payment gateways.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* General Store Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Settings className="h-5 w-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">General Information</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                SEO Tagline / Meta Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Helpline Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="923310397865"
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="space-y-3 text-xs pt-2">
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Studio Address (Lahore)
              </label>
              <input
                type="text"
                value={studioAddress}
                onChange={(e) => setStudioAddress(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Head Office Address
              </label>
              <input
                type="text"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                USA Office Address
              </label>
              <input
                type="text"
                value={usaOfficeAddress}
                onChange={(e) => setUsaOfficeAddress(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
            </div>
          </div>
        </section>

        {/* Announcement Bar */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Bell className="h-5 w-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Announcement Bar Messages</h2>
          </div>

          <div className="space-y-2 text-xs">
            {announcements.map((msg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2.5"
              >
                <span className="text-gray-800">{msg}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAnnouncement(idx)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Add new announcement (e.g. Free shipping on $500 orders)..."
                className="flex-1 rounded-md border border-gray-300 p-2.5 text-xs outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleAddAnnouncement}
                className="rounded-md bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Add
              </button>
            </div>
          </div>
        </section>

        {/* Shipping Rates */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Truck className="h-5 w-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Shipping Configuration</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Free Worldwide Shipping Minimum (PKR)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                placeholder="140000"
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Orders equal or above this amount automatically receive free worldwide delivery.
              </p>
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Standard Domestic Courier Fee (PKR)
              </label>
              <input
                type="number"
                value={standardShippingFee}
                onChange={(e) => setStandardShippingFee(e.target.value)}
                placeholder="250"
                className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Applied to standard domestic deliveries within Pakistan.
              </p>
            </div>
          </div>
        </section>

        {/* Stripe Gateway Settings */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-700" />
              <h2 className="text-base font-bold text-gray-900">Stripe Payment Gateway</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Direct Card Checkout Active
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Stripe Publishable Key
              </label>
              <input
                type="text"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_test_... or pk_live_..."
                className="w-full rounded-md border border-gray-300 p-2.5 font-mono outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Stripe Secret Key
              </label>
              <input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="sk_test_... or sk_live_..."
                className="w-full rounded-md border border-gray-300 p-2.5 font-mono outline-none focus:border-black"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Stored safely. When blank or in test mode, the checkout automatically operates in seamless test simulation mode allowing test card verification.
              </p>
            </div>
          </div>
        </section>

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-4 text-xs text-emerald-700 font-medium border border-emerald-200">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Store settings saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-xs text-red-600 font-medium border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-black px-8 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save All Settings"}</span>
          </button>
        </div>
      </form>

      {/* Admin Security / Password Change */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <Key className="h-5 w-5 text-gray-700" />
          <h2 className="text-base font-bold text-gray-900">Change Admin Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-semibold uppercase text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
            />
          </div>

          {passwordNotice && (
            <div className="flex items-center gap-2 rounded bg-emerald-50 p-3 text-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>{passwordNotice}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 rounded bg-red-50 p-3 text-red-600 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <button
            type="submit"
            className="rounded-md border border-black bg-black px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
          >
            Update Admin Password
          </button>
        </form>
      </section>
    </div>
  );
}
