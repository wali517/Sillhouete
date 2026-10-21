"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, MapPin, LogOut, CheckCircle2, Search, ArrowRight } from "lucide-react";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/format";
import ProductCard from "@/components/products/ProductCard";
import { allProducts } from "@/data/products";

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register" | "lookup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loggedInUser, setLoggedInUser] = useState<{ email: string; name: string } | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");

  // Check localStorage for logged-in customer session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("slh_customer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        setLoggedInUser(parsed);
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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const trimmedEmail = email.toLowerCase().trim();

    // If Admin: redirect directly to /admin dashboard!
    if (trimmedEmail === "admin@sillhouete.com" || trimmedEmail === "admin") {
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password || "admin123" }),
        });
        if (res.ok) {
          router.push("/admin");
          return;
        }
      } catch (err) {
        console.error("Admin login error", err);
      }
    }

    // Customer Login:
    const user = { email: email.trim(), name: email.split("@")[0] };
    setLoggedInUser(user);
    localStorage.setItem("slh_customer_session", JSON.stringify(user));
    fetchOrders(user.email);
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim()) return;
    const user = { email: email.trim(), name: `${firstName} ${lastName}`.trim() };
    setLoggedInUser(user);
    localStorage.setItem("slh_customer_session", JSON.stringify(user));
    fetchOrders(user.email);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUserOrders([]);
    localStorage.removeItem("slh_customer_session");
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;
    setLoadingOrders(true);
    setLookupMessage("");
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(lookupEmail.trim())}`);
      const data = await res.json();
      if (data.orders && data.orders.length > 0) {
        setUserOrders(data.orders);
        setLookupMessage(`Found ${data.orders.length} orders for ${lookupEmail}`);
      } else {
        setUserOrders([]);
        setLookupMessage(`No orders found associated with ${lookupEmail}`);
      }
    } catch {
      setLookupMessage("Could not retrieve orders. Please check your email or contact support.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // If customer is logged in, show their account dashboard
  if (loggedInUser) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-black/60">Customer Portal</p>
            <h1 className="heading mt-1 text-[28px] md:text-[34px]">
              Welcome, {loggedInUser.name}
            </h1>
            <p className="text-xs text-black/60">{loggedInUser.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-black/70 hover:text-sale font-semibold uppercase tracking-wider"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dashboard Content */}
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
              <div className="space-y-6">
                <div className="border border-line bg-soft p-8 text-center space-y-3">
                  <p className="text-sm font-medium">You haven&apos;t placed any orders yet.</p>
                  <p className="text-xs text-black/60">
                    Ready to discover luxury designer dresses? Browse our newest festive arrivals.
                  </p>
                  <Link href="/collections/new-arrivals" className="btn mt-2 text-xs bg-black text-white hover:bg-neutral-800">
                    Shop New Arrivals
                  </Link>
                </div>
                <div>
                  <h3 className="heading text-[16px] mb-4">Recommended For You</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {allProducts.slice(0, 3).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
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
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ord.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
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
                          <span>{item.quantity}x {item.title} ({item.size})</span>
                          <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                      <div>
                        {ord.trackingNumber && (
                          <span className="text-[11px] text-black/70">
                            Tracking: <strong className="font-mono">{ord.trackingNumber}</strong> ({ord.courier || "Courier"})
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

          {/* Account Details / Studio Support */}
          <div className="space-y-6">
            <div className="border border-line bg-soft p-6 space-y-3 text-xs">
              <h3 className="heading text-[16px] border-b border-line pb-2">Customer Profile</h3>
              <p><strong>Name:</strong> {loggedInUser.name}</p>
              <p><strong>Email:</strong> {loggedInUser.email}</p>
              <p className="text-black/60 pt-2 border-t border-line">
                Member of Sillhouete Bespoke Couture. Worldwide delivery updates are sent automatically to this address.
              </p>
            </div>

            <div className="border border-line bg-soft p-6 space-y-3 text-xs">
              <h3 className="heading text-[16px] border-b border-line pb-2">Concierge &amp; Appointments</h3>
              <p>Need bespoke tailoring or wish to schedule a Lahore studio appointment?</p>
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

  return (
    <div className="mx-auto max-w-[440px] px-4 py-20 text-black">
      {tab === "login" ? (
        <div>
          {/* Header matching Image 2 */}
          <h1 className="font-serif text-[28px] md:text-[34px] font-normal text-center tracking-[0.06em] uppercase mb-10 text-[#111111]">
            LOGIN
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold tracking-[0.24em] uppercase text-black mb-2">
                EMAIL
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/40 h-11 px-3 text-sm outline-none focus:border-black bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold tracking-[0.24em] uppercase text-black">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset instructions have been sent.")}
                  className="text-[12px] text-black/70 hover:text-black font-normal"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/40 h-11 px-3 text-sm outline-none focus:border-black bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#111111] text-white py-3.5 text-xs font-bold uppercase tracking-[0.28em] hover:bg-[#2b2b2b] transition-colors mt-6 block"
            >
              SIGN IN
            </button>

            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-xs text-black/90 hover:text-black hover:underline cursor-pointer"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <h1 className="font-serif text-[28px] md:text-[34px] font-normal text-center tracking-[0.06em] uppercase mb-10 text-[#111111]">
            CREATE ACCOUNT
          </h1>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold tracking-[0.24em] uppercase text-black mb-2">
                FIRST NAME
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-black/40 h-11 px-3 text-sm outline-none focus:border-black bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-[0.24em] uppercase text-black mb-2">
                LAST NAME
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-black/40 h-11 px-3 text-sm outline-none focus:border-black bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-[0.24em] uppercase text-black mb-2">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/40 h-11 px-3 text-sm outline-none focus:border-black bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-[0.24em] uppercase text-black mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/40 h-11 px-3 text-sm outline-none focus:border-black bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#111111] text-white py-3.5 text-xs font-bold uppercase tracking-[0.28em] hover:bg-[#2b2b2b] transition-colors mt-6 block"
            >
              CREATE
            </button>

            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => setTab("login")}
                className="text-xs text-black/90 hover:text-black hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
