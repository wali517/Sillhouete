"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Key,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/format";

interface CustomerSession {
  id?: string;
  name: string;
  email: string;
  phone?: string;
}

export default function AccountView({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register" | "lookup" | "recover">(initialTab);

  // Auth Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Recovery Form Fields
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverSent, setRecoverSent] = useState(false);
  const [recoverCode, setRecoverCode] = useState("");
  const [recoverNewPassword, setRecoverNewPassword] = useState("");
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState("");
  const [recoverSuccess, setRecoverSuccess] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  // Logged-in Customer State
  const [loggedInUser, setLoggedInUser] = useState<CustomerSession | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile Edit Mode
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Check localStorage for logged-in customer session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("slh_customer_session");
      if (saved) {
        const parsed: CustomerSession = JSON.parse(saved);
        setLoggedInUser(parsed);
        setEditName(parsed.name || "");
        setEditEmail(parsed.email || "");
        setEditPhone(parsed.phone || "");
        fetchOrders(parsed.email);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchOrders = async (userEmail: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.orders) {
        setUserOrders(data.orders);
      }
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  /* ─── Customer Login ─── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!email.trim()) return;

    const trimmedEmail = email.toLowerCase().trim();

    setAuthLoading(true);

    // 1. Check if this is an administrator login attempt (works strictly with custom admin email set in settings)
    if (trimmedEmail && password) {
      try {
        const adminRes = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const adminData = await adminRes.json();
        if (adminRes.ok && adminData.isAdmin) {
          router.push("/admin");
          return;
        } else if (!adminData.notAdmin && adminRes.status === 401) {
          // Specifically matched the admin account email but the password was wrong
          setAuthError(adminData.error || "Invalid administrator password");
          setAuthLoading(false);
          return;
        }
      } catch {
        // Not admin or network issue, proceed to customer authentication
      }
    }

    // 2. Customer login

    try {
      const res = await fetch("/api/customers/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      const session: CustomerSession = {
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      };

      setLoggedInUser(session);
      setEditName(session.name);
      setEditEmail(session.email);
      setEditPhone(session.phone || "");
      localStorage.setItem("slh_customer_session", JSON.stringify(session));
      fetchOrders(session.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  /* ─── Customer Register ─── */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!email.trim() || !firstName.trim()) {
      setAuthError("First name and email are required.");
      return;
    }

    setAuthLoading(true);

    try {
      const res = await fetch("/api/customers/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: registerPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      const session: CustomerSession = {
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      };

      setLoggedInUser(session);
      setEditName(session.name);
      setEditEmail(session.email);
      setEditPhone(session.phone || "");
      localStorage.setItem("slh_customer_session", JSON.stringify(session));
      fetchOrders(session.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  /* ─── Send Password Reset Code ─── */
  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setRecoverError("");
    setRecoverSuccess("");
    if (!recoverEmail.trim()) return;

    setRecoverLoading(true);
    try {
      const res = await fetch("/api/customers/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoverEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset code");
      setRecoverSent(true);
      setRecoverSuccess("A 6-digit recovery code has been sent to your email.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending reset email";
      setRecoverError(msg);
    } finally {
      setRecoverLoading(false);
    }
  };

  /* ─── Reset Password with Code ─── */
  const handleCompleteReset = async (e: FormEvent) => {
    e.preventDefault();
    setRecoverError("");
    setRecoverSuccess("");

    if (!recoverCode.trim()) {
      setRecoverError("Please enter the 6-digit code received in your email.");
      return;
    }
    if (recoverNewPassword.length < 6) {
      setRecoverError("New password must be at least 6 characters.");
      return;
    }
    if (recoverNewPassword !== recoverConfirmPassword) {
      setRecoverError("Passwords do not match.");
      return;
    }

    setRecoverLoading(true);
    try {
      const res = await fetch("/api/customers/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoverEmail.trim(),
          code: recoverCode.trim(),
          newPassword: recoverNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setRecoverSuccess("Your password has been reset successfully! You can now log in.");
      setTimeout(() => {
        setTab("login");
        setRecoverSent(false);
        setRecoverCode("");
        setRecoverNewPassword("");
        setRecoverConfirmPassword("");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setRecoverError(msg);
    } finally {
      setRecoverLoading(false);
    }
  };

  /* ─── Update Profile (Name, Email, Password, Phone) ─── */
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!editName.trim() || !editEmail.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileMsg({ type: "error", text: "New password must be at least 6 characters." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileMsg({ type: "error", text: "New passwords do not match." });
        return;
      }
    }

    setProfileSaving(true);

    try {
      const res = await fetch("/api/customers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail: loggedInUser?.email,
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      const updatedSession: CustomerSession = {
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      };

      setLoggedInUser(updatedSession);
      localStorage.setItem("slh_customer_session", JSON.stringify(updatedSession));
      setProfileMsg({
        type: "success",
        text: "Your profile has been updated successfully! A confirmation notice was sent to your email.",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // If email changed, refresh orders list
      if (updatedSession.email !== loggedInUser?.email) {
        fetchOrders(updatedSession.email);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setProfileMsg({ type: "error", text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUserOrders([]);
    setIsEditingProfile(false);
    localStorage.removeItem("slh_customer_session");
  };

  /* ─── Logged-In Customer Dashboard ─── */
  if (loggedInUser) {
    return (
      <div className="mx-auto max-w-275 px-4 py-12 md:px-8">
        {/* Dashboard Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs uppercase tracking-widest text-black/60">Customer Portal</p>
            </div>
            <h1 className="heading mt-1 text-[28px] md:text-[34px]">
              Welcome, {loggedInUser.name}
            </h1>
            <p className="text-xs text-black/60">{loggedInUser.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setProfileMsg(null);
              }}
              className="flex items-center gap-1.5 border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-neutral-50 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditingProfile ? "View Orders" : "Edit Profile"}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-black/70 hover:text-sale font-semibold uppercase tracking-wider px-3 py-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Profile Edit Modal / Accordion */}
        {isEditingProfile && (
          <div className="my-8 rounded-lg border border-line bg-white p-6 md:p-8 shadow-sm">
            <div className="border-b border-line pb-4 mb-6">
              <h2 className="heading text-[22px] flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                <span>Edit Profile &amp; Security Settings</span>
              </h2>
              <p className="text-xs text-black/60 mt-1">
                You can change your full name, email address, phone number, and password here. All changes save live into the database and trigger a confirmation email.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`mb-6 flex items-start gap-2.5 rounded p-4 text-xs ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="acct-input"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="acct-input"
                    placeholder="your-email@example.com"
                  />
                  <p className="text-[11px] text-black/50 mt-1">
                    Changing your email will update your login credentials and order tracking.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="acct-input"
                  placeholder="+92 300 1234567"
                />
              </div>

              {/* Password Section */}
              <div className="border-t border-line pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-4 w-4 text-black/70" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                    Change Password (Optional)
                  </h3>
                </div>
                <p className="text-xs text-black/60 mb-4">
                  Leave blank if you do not want to change your password.
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/70 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="acct-input"
                      placeholder="Current password"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/70 mb-1">
                      New Password (Min 6 chars)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="acct-input"
                      placeholder="New password"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/70 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="acct-input"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex h-[48px] items-center justify-center bg-black px-8 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                >
                  {profileSaving ? "Saving..." : "Save Profile & Security Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="text-xs font-semibold uppercase tracking-wider text-black/70 underline hover:text-black"
                >
                  Close Editor
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-[1.5fr_1fr]">
          {/* Orders Section */}
          <div className="space-y-4">
            <h2 className="heading text-[20px] flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Order History</span>
            </h2>

            {loadingOrders ? (
              <p className="text-xs text-black/60">Loading orders...</p>
            ) : userOrders.length === 0 ? (
              <div className="border border-line bg-soft p-8 text-center space-y-3">
                <p className="text-sm font-medium">You haven&apos;t placed any orders yet.</p>
                <p className="text-xs text-black/60">
                  Ready to discover luxury designer dresses? Browse our newest festive arrivals.
                </p>
                <Link
                  href="/collections/new-arrivals"
                  className="inline-block mt-2 bg-black text-white px-6 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Shop New Arrivals
                </Link>
              </div>
            ) : (
              <div className="border border-line divide-y divide-line">
                {userOrders.map((ord) => (
                  <div key={ord.id} className="p-4 md:p-6 space-y-3 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-sm">#{ord.orderNumber}</span>
                        <span className="ml-3 text-xs text-black/50">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            ord.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                        <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-black/80">
                          <span>
                            {item.quantity}x {item.title} ({item.size})
                          </span>
                          <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                      <div>
                        {ord.trackingNumber && (
                          <span className="text-[11px] text-black/70">
                            Tracking: <strong className="font-mono">{ord.trackingNumber}</strong> (
                            {ord.courier || "Courier"})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm">Total: {formatPrice(ord.total)}</span>
                        <Link
                          href={`/order-confirmation/${ord.id}`}
                          className="font-bold underline text-xs hover:text-black/70"
                        >
                          View Receipt →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Details / Concierge */}
          <div className="space-y-6">
            <div className="border border-line bg-soft p-6 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h3 className="heading text-[16px]">Customer Profile</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="text-[11px] font-bold uppercase text-black underline hover:opacity-70"
                >
                  Edit
                </button>
              </div>
              <p>
                <strong>Name:</strong> {loggedInUser.name}
              </p>
              <p>
                <strong>Email:</strong> {loggedInUser.email}
              </p>
              {loggedInUser.phone && (
                <p>
                  <strong>Phone:</strong> {loggedInUser.phone}
                </p>
              )}
              <p className="text-black/60 pt-2 border-t border-line">
                Member of Sillhouete Bespoke Couture. Worldwide delivery updates are sent automatically to this address.
              </p>
            </div>

            <div className="border border-line bg-soft p-6 space-y-3 text-xs">
              <h3 className="heading text-[16px] border-b border-line pb-2">
                Concierge &amp; Studio Appointments
              </h3>
              <p>Need bespoke bridal customization or wish to schedule a Lahore studio appointment?</p>
              <div className="space-y-1 font-medium">
                <p>• Studio: Almas Tower, MM Alam Rd, Gulberg 2, Lahore</p>
                <p>• WhatsApp: +92 331 0397865</p>
                <p>• Email: info@sillhouete.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const label = "mb-2 block text-[11px] font-bold uppercase tracking-[0.3em] text-black";
  const submitBtn =
    "mt-8 flex h-[56px] w-full items-center justify-center bg-[#111111] text-xs font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-[#2b2b2b] disabled:opacity-50";

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-28 pt-20 text-black md:pt-24">
      {/* ─── Password Recovery Tab ─── */}
      {tab === "recover" ? (
        <div id="RecoverPasswordForm">
          <h1 className="mb-4 text-center text-[26px] font-bold uppercase tracking-[0.08em] text-[#111111] md:text-[28px]">
            Reset your password
          </h1>
          <p className="mb-8 text-center text-[14px] text-neutral-600">
            Enter your email and we will send you a 6-digit verification code.
          </p>

          {recoverError && (
            <div className="mb-6 flex items-start gap-2.5 rounded bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{recoverError}</span>
            </div>
          )}

          {recoverSuccess && (
            <div className="mb-6 flex items-start gap-2.5 rounded bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{recoverSuccess}</span>
            </div>
          )}

          {!recoverSent ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label htmlFor="RecoverEmail" className={label}>
                  Email
                </label>
                <input
                  id="RecoverEmail"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  className="acct-input"
                  placeholder="your-email@example.com"
                />
              </div>

              <button type="submit" disabled={recoverLoading} className={submitBtn}>
                {recoverLoading ? "Sending Code..." : "Send Reset Code"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  id="HideRecoverPasswordLink"
                  onClick={() => {
                    setTab("login");
                    setRecoverError("");
                    setRecoverSuccess("");
                  }}
                  className="text-[14px] text-black hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteReset} className="space-y-6">
              <div>
                <label className={label}>6-Digit Recovery Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={recoverCode}
                  onChange={(e) => setRecoverCode(e.target.value)}
                  className="acct-input font-mono tracking-widest text-center text-lg"
                  placeholder="123456"
                />
              </div>

              <div>
                <label className={label}>New Password</label>
                <input
                  type="password"
                  required
                  value={recoverNewPassword}
                  onChange={(e) => setRecoverNewPassword(e.target.value)}
                  className="acct-input"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className={label}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={recoverConfirmPassword}
                  onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                  className="acct-input"
                  placeholder="Confirm password"
                />
              </div>

              <button type="submit" disabled={recoverLoading} className={submitBtn}>
                {recoverLoading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setRecoverSent(false);
                    setTab("login");
                  }}
                  className="text-[14px] text-black hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      ) : tab === "login" ? (
        /* ─── Sign In Tab ─── */
        <div>
          <h1 className="mb-12 text-center text-[28px] font-bold uppercase tracking-[0.08em] text-[#111111] md:text-[30px]">
            Login
          </h1>

          {authError && (
            <div className="mb-6 flex items-start gap-2.5 rounded bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-7">
            <div>
              <label htmlFor="login-email" className={label}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="acct-input"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="text-[11px] font-bold uppercase tracking-[0.3em] text-black">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab("recover");
                    setAuthError("");
                  }}
                  className="text-[13px] font-normal text-black/80 hover:text-black hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="acct-input"
              />
            </div>

            <button type="submit" disabled={authLoading} className={submitBtn}>
              {authLoading ? "Signing In..." : "Sign In"}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setAuthError("");
                }}
                className="text-[14px] text-black hover:underline"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ─── Register Tab ─── */
        <div>
          <h1 className="mb-12 text-center text-[28px] font-bold uppercase tracking-[0.08em] text-[#111111] md:text-[30px]">
            Create Account
          </h1>

          {authError && (
            <div className="mb-6 flex items-start gap-2.5 rounded bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-7">
            <div>
              <label htmlFor="reg-first" className={label}>
                First name *
              </label>
              <input
                id="reg-first"
                type="text"
                required
                autoFocus
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="acct-input"
              />
            </div>

            <div>
              <label htmlFor="reg-last" className={label}>
                Last name
              </label>
              <input
                id="reg-last"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="acct-input"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className={label}>
                Email *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="acct-input"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className={label}>
                Phone Number (Optional)
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                className="acct-input"
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className={label}>
                Password *
              </label>
              <input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="acct-input"
                placeholder="Min 6 characters"
              />
            </div>

            <button type="submit" disabled={authLoading} className={submitBtn}>
              {authLoading ? "Creating Account..." : "Create"}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setAuthError("");
                }}
                className="text-[14px] text-black hover:underline"
              >
                Return to login
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
