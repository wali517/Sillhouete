/**
 * Seed script — called automatically by a Next.js API route on first startup.
 * Seeds MongoDB with products from static data + initial orders, customers, etc.
 */
import connectDB from "./mongodb";
import { ProductModel } from "./models/Product";
import { OrderModel } from "./models/Order";
import { CustomerModel } from "./models/Customer";
import { ContactMessageModel } from "./models/ContactMessage";
import { BlogPostModel } from "./models/BlogPost";
import { SiteSettingsModel } from "./models/SiteSettings";

async function seedProducts() {
  const count = await ProductModel.countDocuments();
  if (count > 0) return;
  console.log("ℹ️ Product collection checked (managed directly in MongoDB Atlas).");
}

async function seedOrders() {
  const count = await OrderModel.countDocuments();
  if (count > 0) return;

  console.log("🌱 Seeding initial orders...");
  const orders = [
    {
      id: "ord-1001",
      orderNumber: "SLH-10480",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      customer: { name: "Ayesha Khan", email: "ayesha.khan@example.com", phone: "+92 300 1234567" },
      shippingAddress: {
        firstName: "Ayesha", lastName: "Khan", email: "ayesha.khan@example.com",
        phone: "+92 300 1234567", address: "House 42, Block C, Phase 5 DHA",
        city: "Lahore", state: "Punjab", postalCode: "54000", country: "Pakistan",
      },
      items: [{ id: "iris-rm-03", handle: "iris-rm-03", title: "Iris", price: 44900, size: "M", quantity: 1, image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-iris-royal-blue-intricate-embroidery.jpg?v=1776742287" }],
      subtotal: 44900, shipping: 0, discount: 0, total: 44900, currency: "PKR",
      paymentMethod: "stripe", paymentStatus: "paid", status: "processing",
      trackingNumber: "TCS-98421049", courier: "TCS Express",
    },
    {
      id: "ord-1002",
      orderNumber: "SLH-10481",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      customer: { name: "Fatima Zahra", email: "fatima.z@example.com", phone: "+92 321 9876543" },
      shippingAddress: {
        firstName: "Fatima", lastName: "Zahra", email: "fatima.z@example.com",
        phone: "+92 321 9876543", address: "Apt 4B, Clifton Block 2",
        city: "Karachi", state: "Sindh", postalCode: "75600", country: "Pakistan",
      },
      items: [{ id: "maraki", handle: "maraki", title: "Maraki", price: 32900, size: "S", quantity: 1, image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-meraki-light-grey-sequins.jpg?v=1769691351" }],
      subtotal: 32900, shipping: 250, discount: 0, total: 33150, currency: "PKR",
      paymentMethod: "cod", paymentStatus: "pending", status: "pending",
    },
  ];

  await OrderModel.insertMany(orders, { ordered: false }).catch(() => {});
  console.log("✅ Seeded initial orders");
}

async function seedCustomers() {
  const count = await CustomerModel.countDocuments();
  if (count > 0) return;

  console.log("🌱 Seeding initial customers...");
  const customers = [
    { id: "cust-1", name: "Ayesha Khan", email: "ayesha.khan@example.com", phone: "+92 300 1234567", ordersCount: 1, totalSpent: 44900 },
    { id: "cust-2", name: "Fatima Zahra", email: "fatima.z@example.com", phone: "+92 321 9876543", ordersCount: 1, totalSpent: 33150 },
  ];

  await CustomerModel.insertMany(customers, { ordered: false }).catch(() => {});
  console.log("✅ Seeded initial customers");
}

async function seedMessages() {
  // Do not seed dummy contact messages - keep real customer messages only
  return;
}

async function seedBlogs() {
  const count = await BlogPostModel.countDocuments();
  if (count > 0) return;
  console.log("ℹ️ Blog posts collection checked (managed directly in MongoDB Atlas).");
}

async function seedSettings() {
  const count = await SiteSettingsModel.countDocuments();
  if (count > 0) return;

  console.log("🌱 Seeding site settings...");
  await SiteSettingsModel.create({
    storeName: "Sillhouete",
    title: "Shop Pakistani Designer Dresses for Women Online – Sillhouete",
    description: "Shop Pakistan designer dresses for women at Sillhouete. Explore bridal dresses, luxury formals, and elegant ready-to-wear outfits with worldwide delivery.",
    email: "info@sillhouete.com",
    phone: "+92 331 0397865",
    whatsapp: "+923310397865",
    studioAddress: "Sillhouete, Almas Tower, MM Alam Rd, Block T, Gulberg 2, Lahore",
    officeAddress: "327-B, Street 7, Lane 15, Cavalry Ground, Lahore",
    usaOfficeAddress: "ADVENT BUSINESS CONSULTAX LLC, 18w100 22nd St, Ste 124, Oakbrook Terrace, IL, Zip Code 60181",
    announcements: [
      "FREE SHIPPING ALL OVER WORLD ON $500 AND ABOVE ORDERS",
      "WE OFFER WORLDWIDE SHIPPING.",
      "FOR BOOKINGS: 03154204981 / 03310397865",
    ],
    freeShippingThreshold: 140000,
    standardShippingFee: 250,
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeEnabled: true,
    currency: "PKR",
    adminPasswordHash: "admin123",
    bankName: "Meezan Bank",
    bankAccountTitle: "SILLHOUETE",
    bankIban: "PK80MEZN0002160109517881",
    discountCodes: [
      { code: "WELCOME5", percent: 5, active: true },
      { code: "EID2026", percent: 10, active: true },
    ],
  });
  console.log("✅ Seeded site settings");
}

let seeded = false;

export async function runSeedIfEmpty() {
  if (seeded) return;

  try {
    await connectDB();
    const count = await ProductModel.countDocuments();
    if (count > 0) {
      seeded = true;
      return;
    }

    await Promise.allSettled([
      seedProducts(),
      seedOrders(),
      seedCustomers(),
      seedMessages(),
      seedBlogs(),
      seedSettings(),
    ]);
    seeded = true;
  } catch (err) {
    console.warn("⚠️ runSeedIfEmpty notice:", err);
  }
}
