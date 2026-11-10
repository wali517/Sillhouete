import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings, updateSettings } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/data/site";

const AUTH_COOKIE = "slh_admin_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE);
  const isAuthenticated = token?.value === "authenticated_admin_session";
  const settings = await getSettings();
  return NextResponse.json({
    authenticated: isAuthenticated,
    adminEmail: settings.adminEmail || "admin@sillhouete.com",
  });
}

export async function POST(req: Request) {
  try {
    await runSeedIfEmpty(); // Ensure DB is seeded on first admin login
    const { email, password } = await req.json();
    const settings = await getSettings();
    const currentAdminEmail = (settings.adminEmail || "admin@sillhouete.com").toLowerCase().trim();
    const currentPass = settings.adminPasswordHash || "admin123";

    const enteredEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    // Strictly authenticate against the admin email stored in MongoDB
    if (!enteredEmail || enteredEmail !== currentAdminEmail) {
      return NextResponse.json(
        { error: "Invalid administrator email address", notAdmin: true },
        { status: 401 }
      );
    }

    // Strictly authenticate against the admin password stored in MongoDB
    if (!password || password !== currentPass) {
      return NextResponse.json({ error: "Invalid administrator password" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, "authenticated_admin_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      isAdmin: true,
      adminEmail: settings.adminEmail || "admin@sillhouete.com",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: change admin email and/or password from settings page
export async function PATCH(req: Request) {
  try {
    const { currentPassword, newAdminEmail, newPassword } = await req.json();
    const settings = await getSettings();
    const storedPass = settings.adminPasswordHash || "admin123";
    const currentAdminEmail = settings.adminEmail || "admin@sillhouete.com";

    // Strictly verify current password matches MongoDB
    if (!currentPassword || currentPassword !== storedPass) {
      return NextResponse.json({ error: "Current administrator password is incorrect" }, { status: 401 });
    }

    const updates: Record<string, string> = {};
    const updatedFields: string[] = [];

    if (newAdminEmail) {
      const cleanEmail = newAdminEmail.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: "Please provide a valid new admin email address" }, { status: 400 });
      }
      if (cleanEmail !== currentAdminEmail.toLowerCase().trim()) {
        updates.adminEmail = cleanEmail;
        updatedFields.push(`Admin Email (changed to ${cleanEmail})`);
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }
      updates.adminPasswordHash = newPassword;
      updatedFields.push("Admin Password");
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "No changes detected" });
    }

    const updated = await updateSettings(updates);

    // Send confirmation email to the new admin email
    const recipient = updates.adminEmail || currentAdminEmail;
    sendEmail({
      to: recipient,
      subject: `[Security Alert] ${SITE.name} Admin Credentials Updated`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; color: #111;">
          <h2 style="font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Administrator Security Alert</h2>
          <p style="font-size: 14px; line-height: 1.6;">
            Your ${SITE.name} store administrator credentials were successfully updated on <strong>${new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })} PKT</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6;"><strong>Updated fields:</strong></p>
          <ul>
            ${updatedFields.map((f) => `<li>${f}</li>`).join("")}
          </ul>
          <p style="font-size: 13px; color: #666; margin-top: 16px;">
            If you did not perform this change, please contact technical support or reset your password immediately.
          </p>
        </div>
      `,
    }).catch((err) => console.warn("Admin credential update email notice:", err));

    return NextResponse.json({
      success: true,
      adminEmail: updated.adminEmail || updates.adminEmail || currentAdminEmail,
      message: "Admin credentials successfully updated",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to change admin credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return NextResponse.json({ success: true });
}
