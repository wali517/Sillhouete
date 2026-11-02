import { NextResponse } from "next/server";
import { getCustomerByEmail, createCustomer } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/data/site";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, phone } = await req.json();

    if (!email || !firstName) {
      return NextResponse.json({ error: "First name and email are required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const existing = await getCustomerByEmail(normalized);
    if (existing && existing.password) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const name = `${firstName} ${lastName || ""}`.trim();
    const customer = await createCustomer({
      name,
      email: normalized,
      phone: phone || "",
      password: password || "",
    });

    // Send welcome email via nodemailer
    sendEmail({
      to: normalized,
      subject: `Welcome to ${SITE.name} Atelier`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; border: 1px solid #e5e5e5;">
          <h2 style="font-size: 22px; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 24px;">
            ${SITE.name}
          </h2>
          <p style="font-size: 15px; line-height: 1.6;">Hello ${name},</p>
          <p style="font-size: 15px; line-height: 1.6;">
            Welcome to ${SITE.name}. Your online account is now active. You can track your bespoke orders, save delivery addresses, and enjoy seamless one-click shopping.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">
            ${SITE.name} Boutique · MM Alam Road, Gulberg 2, Lahore
          </p>
        </div>
      `,
    }).catch((err) => console.warn("Welcome email notice:", err));

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
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

