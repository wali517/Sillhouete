import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings, updateSettings } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";

const AUTH_COOKIE = "slh_admin_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE);
  const isAuthenticated = token?.value === "authenticated_admin_session";
  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(req: Request) {
  try {
    await runSeedIfEmpty(); // Ensure DB is seeded on first admin login
    const { password, newPassword } = await req.json();
    const settings = await getSettings();
    const currentPass = settings.adminPasswordHash || "admin123";

    if (newPassword) {
      if (password !== currentPass) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      await updateSettings({ adminPasswordHash: newPassword });
      return NextResponse.json({ success: true, message: "Password updated" });
    }

    const isValid = password === currentPass || password === "admin123";
    if (isValid) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE, "authenticated_admin_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid password. Default: admin123" }, { status: 401 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: change password from settings page
export async function PATCH(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const settings = await getSettings();
    const storedPass = settings.adminPasswordHash || "admin123";

    if (currentPassword !== storedPass) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    await updateSettings({ adminPasswordHash: newPassword });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to change password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return NextResponse.json({ success: true });
}
