import { NextResponse } from "next/server";
import { getCustomerByEmail, updateCustomerProfile } from "@/lib/db";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { sendProfileUpdatedNotificationEmail } from "@/lib/email";

export async function PUT(req: Request) {
  try {
    const { currentEmail, name, email, phone, currentPassword, newPassword } = await req.json();

    if (!currentEmail) {
      return NextResponse.json({ error: "Current customer email is required" }, { status: 400 });
    }

    const currentNormalized = currentEmail.toLowerCase().trim();
    const customer = await getCustomerByEmail(currentNormalized);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // If changing password, verify current password if customer already had one set
    if (newPassword) {
      if (customer.password && customer.password !== currentPassword) {
        return NextResponse.json(
          { error: "Current password does not match" },
          { status: 400 }
        );
      }
    }

    // Check if new email is taken by someone else
    const newNormalized = email ? email.toLowerCase().trim() : currentNormalized;
    if (newNormalized !== currentNormalized) {
      const existing = await getCustomerByEmail(newNormalized);
      if (existing && existing.id !== customer.id) {
        return NextResponse.json(
          { error: "This new email is already associated with another account" },
          { status: 400 }
        );
      }
    }

    const updatedFields: string[] = [];
    if (name && name !== customer.name) updatedFields.push("Full Name");
    if (newNormalized !== currentNormalized) updatedFields.push(`Email Address (changed to ${newNormalized})`);
    if (phone && phone !== customer.phone) updatedFields.push("Phone Number");
    if (newPassword) updatedFields.push("Password");

    const updated = await updateCustomerProfile(customer.id, {
      name: name || customer.name,
      email: newNormalized,
      phone: phone !== undefined ? phone : customer.phone,
      password: newPassword || customer.password,
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // If email was changed, update all existing customer orders to the new email
    if (newNormalized !== currentNormalized) {
      try {
        await connectDB();
        await OrderModel.updateMany(
          { "customer.email": currentNormalized },
          { $set: { "customer.email": newNormalized, "shippingAddress.email": newNormalized } }
        );
      } catch (orderErr) {
        console.warn("Order email sync notice:", orderErr);
      }
    }

    // Send notification email via nodemailer if fields were modified
    if (updatedFields.length > 0) {
      try {
        await sendProfileUpdatedNotificationEmail({
          email: newNormalized,
          name: updated.name,
          updatedFields,
        });
      } catch (err) {
        console.warn("Profile update email notice:", err);
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Profile update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

