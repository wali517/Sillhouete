import { NextResponse } from "next/server";
import { getCustomerByEmail, createCustomer } from "@/lib/db";
import { sendLoginAlertEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    let customer = await getCustomerByEmail(normalized);

    // If customer doesn't exist yet, auto-create account for seamless shopping experience
    if (!customer) {
      customer = await createCustomer({
        name: normalized.split("@")[0],
        email: normalized,
        password: password || "",
      });
    } else if (customer.password && password && customer.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Trigger login notification via nodemailer
    sendLoginAlertEmail({
      email: customer.email,
      name: customer.name,
      time: new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }) + " (PKT)",
    }).catch((err) => console.warn("Login email notice:", err));

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

