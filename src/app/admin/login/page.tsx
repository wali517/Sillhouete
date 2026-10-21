"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { SITE } from "@/data/site";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@sillhouete.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block relative h-10 w-28">
            <Image
              src={SITE.logo}
              alt="Sillhouete"
              fill
              sizes="112px"
              priority
              className="object-contain"
            />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 uppercase">
            Store Administration
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to manage products, orders, customers, inquiries and content.
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            <span>Administrator Credentials</span>
          </p>
          <p><strong>Email:</strong> admin@sillhouete.com</p>
          <p><strong>Password:</strong> admin123</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sillhouete.com"
              className="mt-1 w-full rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Admin Password
            </label>
            <div className="relative mt-1">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-md border border-gray-300 p-3 pr-10 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              <Lock className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-black py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-gray-800 transition-colors"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Admin"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Quick test convenience note */}
          <div className="rounded-md bg-gray-50 p-3 text-center border border-gray-100">
            <p className="text-xs text-gray-500">
              Default password: <strong className="text-black font-mono">admin123</strong>
            </p>
            <button
              type="button"
              onClick={() => setPassword("admin123")}
              className="mt-1 text-[11px] font-semibold text-black underline hover:text-gray-700"
            >
              Fill default password
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link href="/" className="text-xs text-gray-500 hover:text-black hover:underline">
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
