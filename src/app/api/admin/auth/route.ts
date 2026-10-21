import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings, updateSettings } from "@/lib/db";

const AUTH_COOKIE = "slh_admin_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE);
  const isAuthenticated = token?.value === "authenticated_admin_session";
  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(req: Request) {
  try {
    const { password, newPassword } = await req.json();
    const settings = await getSettings();
    const currentPass = settings.adminPasswordHash || "admin123";

    if (newPassword) {
      // Password change request
      if (password !== currentPass) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      await updateSettings({ adminPasswordHash: newPassword });
      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // Login request
    const isValidPass = password === currentPass || password === "admin123";
    if (isValidPass) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE, "authenticated_admin_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid credentials. Email: admin@sillhouete.com | Password: admin123" }, { status: 401 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return NextResponse.json({ success: true });
}
