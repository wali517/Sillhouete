"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Settings, CreditCard, Truck, Bell, Store, Lock } from "lucide-react";
import type { SiteSettings } from "@/types";

type Tab = "store" | "shipping" | "announcements" | "payment" | "discounts" | "password";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings & { bankName?: string; bankAccountTitle?: string; bankIban?: string; discountCodes?: Array<{ code: string; percent: number; active: boolean }> }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newDiscountPercent, setNewDiscountPercent] = useState("10");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const saveSection = async (tab: Tab, data: Partial<SiteSettings>) => {
    setSaving(tab);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSettings(d.settings || settings);
      showToast("Settings saved successfully");
    } catch {
      showToast("Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) { showToast("Passwords do not match"); return; }
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters"); return; }
    try {
      const res = await fetch("/api/admin/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || "Failed to change password");
        return;
      }
      showToast("Password changed successfully");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      showToast("Failed to change password");
    }
  };

  const tabs: Array<{ key: Tab; label: string; icon: typeof Store }> = [
    { key: "store", label: "Store Info", icon: Store },
    { key: "shipping", label: "Shipping", icon: Truck },
    { key: "announcements", label: "Announcements", icon: Bell },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "discounts", label: "Discounts", icon: Settings },
    { key: "password", label: "Admin Password", icon: Lock },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your store configuration</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === key ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Store Info */}
      {activeTab === "store" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Store Information</h2>
          {[
            { label: "Store Name", key: "storeName" },
            { label: "SEO Title", key: "title" },
            { label: "Email", key: "email" },
            { label: "Phone", key: "phone" },
            { label: "WhatsApp Number", key: "whatsapp" },
            { label: "Studio Address", key: "studioAddress" },
            { label: "Office Address", key: "officeAddress" },
            { label: "USA Office Address", key: "usaOfficeAddress" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input type="text" value={(settings as Record<string, string>)[key] || ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
            <textarea rows={3} value={settings.description || ""}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
          </div>
          <button onClick={() => saveSection("store", settings as Partial<SiteSettings>)} disabled={saving === "store"}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving === "store" ? "Saving..." : "Save Store Info"}
          </button>
        </div>
      )}

      {/* Shipping */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Shipping Settings</h2>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Free Shipping Threshold (PKR)</label>
            <input type="number" value={settings.freeShippingThreshold || 0}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Standard Shipping Fee (PKR)</label>
            <input type="number" value={settings.standardShippingFee || 0}
              onChange={(e) => setSettings({ ...settings, standardShippingFee: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>
          <button onClick={() => saveSection("shipping", { freeShippingThreshold: settings.freeShippingThreshold, standardShippingFee: settings.standardShippingFee } as Partial<SiteSettings>)} disabled={saving === "shipping"}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving === "shipping" ? "Saving..." : "Save Shipping"}
          </button>
        </div>
      )}

      {/* Announcements */}
      {activeTab === "announcements" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Announcement Bar</h2>
          <div className="space-y-2">
            {(settings.announcements || []).map((ann, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={ann}
                  onChange={(e) => {
                    const newAnns = [...(settings.announcements || [])];
                    newAnns[i] = e.target.value;
                    setSettings({ ...settings, announcements: newAnns });
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                <button onClick={() => {
                  const newAnns = (settings.announcements || []).filter((_, j) => j !== i);
                  setSettings({ ...settings, announcements: newAnns });
                }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="New announcement text..." value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            <button onClick={() => {
              if (!newAnnouncement.trim()) return;
              setSettings({ ...settings, announcements: [...(settings.announcements || []), newAnnouncement.trim()] });
              setNewAnnouncement("");
            }} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Plus className="h-4 w-4 text-gray-700" />
            </button>
          </div>
          <button onClick={() => saveSection("announcements", { announcements: settings.announcements } as Partial<SiteSettings>)} disabled={saving === "announcements"}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving === "announcements" ? "Saving..." : "Save Announcements"}
          </button>
        </div>
      )}

      {/* Payment */}
      {activeTab === "payment" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Payment Settings</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input type="checkbox" id="stripeEnabled" checked={settings.stripeEnabled ?? true}
              onChange={(e) => setSettings({ ...settings, stripeEnabled: e.target.checked })}
              className="h-4 w-4 accent-black" />
            <label htmlFor="stripeEnabled" className="text-sm font-medium text-gray-900">Enable Stripe Card Payments</label>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Stripe Publishable Key</label>
            <input type="text" value={settings.stripePublishableKey || ""}
              onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
              placeholder="pk_test_..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Stripe Secret Key</label>
            <input type="password" value={settings.stripeSecretKey || ""}
              onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
              placeholder="sk_test_..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-gray-400" />
          </div>
          <hr className="border-gray-100" />
          <h3 className="font-semibold text-gray-900 text-sm">Bank Deposit Details</h3>
          {[
            { label: "Bank Name", key: "bankName" },
            { label: "Account Title", key: "bankAccountTitle" },
            { label: "IBAN", key: "bankIban" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input type="text" value={(settings as Record<string, string>)[key] || ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          ))}
          <button onClick={() => saveSection("payment", settings as Partial<SiteSettings>)} disabled={saving === "payment"}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving === "payment" ? "Saving..." : "Save Payment Settings"}
          </button>
        </div>
      )}

      {/* Discount Codes */}
      {activeTab === "discounts" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Discount Codes</h2>
          <div className="space-y-2">
            {(settings.discountCodes || []).map((dc, i) => (
              <div key={i} className="flex items-center gap-2 p-3 border border-gray-100 rounded-lg">
                <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded">{dc.code}</span>
                <span className="text-sm text-gray-600">{dc.percent}% off</span>
                <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                  <input type="checkbox" checked={dc.active}
                    onChange={(e) => {
                      const codes = [...(settings.discountCodes || [])];
                      codes[i] = { ...codes[i], active: e.target.checked };
                      setSettings({ ...settings, discountCodes: codes });
                    }} className="h-3.5 w-3.5 accent-black" />
                  <span className="text-xs text-gray-600">Active</span>
                </label>
                <button onClick={() => {
                  const codes = (settings.discountCodes || []).filter((_, j) => j !== i);
                  setSettings({ ...settings, discountCodes: codes });
                }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Code</label>
              <input type="text" value={newDiscountCode} onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-gray-400" />
            </div>
            <div className="w-24">
              <label className="text-xs font-semibold text-gray-600 block mb-1">% Off</label>
              <input type="number" min="1" max="100" value={newDiscountPercent}
                onChange={(e) => setNewDiscountPercent(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <button onClick={() => {
              if (!newDiscountCode.trim()) return;
              const codes = [...(settings.discountCodes || []), { code: newDiscountCode.trim(), percent: Number(newDiscountPercent), active: true }];
              setSettings({ ...settings, discountCodes: codes });
              setNewDiscountCode(""); setNewDiscountPercent("10");
            }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => saveSection("discounts", { discountCodes: settings.discountCodes } as unknown as Partial<SiteSettings>)} disabled={saving === "discounts"}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving === "discounts" ? "Saving..." : "Save Discount Codes"}
          </button>
        </div>
      )}

      {/* Password */}
      {activeTab === "password" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Change Admin Password</h2>
          {[
            { label: "Current Password", value: oldPassword, set: setOldPassword },
            { label: "New Password", value: newPassword, set: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input type="password" value={value} onChange={(e) => set(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          ))}
          <button onClick={handlePasswordChange}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
            <Lock className="h-4 w-4" /> Update Password
          </button>
        </div>
      )}
    </div>
  );
}
