"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Settings, CreditCard, Truck, Bell, Store, Lock, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@/types";

type Tab = "store" | "shipping" | "announcements" | "payment" | "discounts" | "security";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings & { bankName?: string; bankAccountTitle?: string; bankIban?: string; discountCodes?: Array<{ code: string; percent: number; active: boolean }> }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newDiscountPercent, setNewDiscountPercent] = useState("10");
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credentialUpdating, setCredentialUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          setAdminEmailInput(d.settings.adminEmail || "admin@sillhouete.com");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const saveSection = async (tab: Tab, data: Partial<SiteSettings>) => {
    setSaving(tab);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save settings");
      if (d.settings) {
        setSettings((prev) => ({ ...prev, ...d.settings }));
      }
      showToast("Settings saved successfully and synced with live store!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      showToast(msg);
    } finally {
      setSaving(null);
    }
  };

  const handleAdminCredentialsChange = async () => {
    if (!oldPassword) {
      showToast("Please enter your current admin password to verify changes");
      return;
    }
    if (!adminEmailInput.trim()) {
      showToast("Admin email cannot be empty");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      showToast("New passwords do not match");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      showToast("New password must be at least 6 characters");
      return;
    }

    setCredentialUpdating(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newAdminEmail: adminEmailInput.trim(),
          newPassword: newPassword || undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        showToast(d.error || "Failed to update admin credentials");
        return;
      }

      showToast(d.message || "Admin credentials updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (d.adminEmail) {
        setSettings((prev) => ({ ...prev, adminEmail: d.adminEmail }));
        setAdminEmailInput(d.adminEmail);
      }
    } catch {
      showToast("Failed to update admin credentials");
    } finally {
      setCredentialUpdating(false);
    }
  };

  const tabs: Array<{ key: Tab; label: string; icon: typeof Store }> = [
    { key: "store", label: "Store Info", icon: Store },
    { key: "shipping", label: "Shipping", icon: Truck },
    { key: "announcements", label: "Announcements", icon: Bell },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "discounts", label: "Discounts", icon: Settings },
    { key: "security", label: "Admin Account & Security", icon: ShieldCheck },
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
          <button onClick={() => saveSection("store", {
            storeName: settings.storeName,
            title: settings.title,
            email: settings.email,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            studioAddress: settings.studioAddress,
            officeAddress: settings.officeAddress,
            usaOfficeAddress: settings.usaOfficeAddress,
            description: settings.description,
          })} disabled={saving === "store"}
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
          <button onClick={() => saveSection("announcements", { announcements: settings.announcements || [] })} disabled={saving === "announcements"}
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
          <button onClick={() => saveSection("payment", {
            stripeEnabled: settings.stripeEnabled ?? true,
            stripePublishableKey: settings.stripePublishableKey || "",
            stripeSecretKey: settings.stripeSecretKey || "",
            bankName: settings.bankName || "",
            bankAccountTitle: settings.bankAccountTitle || "",
            bankIban: settings.bankIban || "",
          })} disabled={saving === "payment"}
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
          <button onClick={() => saveSection("discounts", { discountCodes: settings.discountCodes || [] })} disabled={saving === "discounts"}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving === "discounts" ? "Saving..." : "Save Discount Codes"}
          </button>
        </div>
      )}

      {/* Admin Account & Security */}
      {activeTab === "security" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gray-700" />
              <span>Admin Account &amp; Credentials</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              You can update your administrator login email address and change your store administration password here. All changes save live into the database.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 block mb-1.5">
                Administrator Login Email *
              </label>
              <input
                type="email"
                required
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                placeholder="admin@sillhouete.com"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                You will use this email address to sign into the store administration panel.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Current Password * <span className="text-gray-400 font-normal">(Required to verify changes)</span>
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 block mb-1.5">
                    New Password <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 block mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleAdminCredentialsChange}
                disabled={credentialUpdating}
                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{credentialUpdating ? "Updating..." : "Save Admin Credentials"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
