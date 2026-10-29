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

  console.log("🌱 Seeding products from static data...");
  try {
    // Import large product array lazily to avoid build issues
    const { allProducts } = await import("@/data/products");
    const products = allProducts.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      priceFrom: p.priceFrom ?? false,
      image: p.image,
      hoverImage: p.hoverImage,
      images: [p.image, p.hoverImage].filter(Boolean),
      alt: p.alt,
      ratio: p.ratio ?? 1.5,
      isNew: p.isNew ?? false,
      isSale: false,
      isBestSeller: false,
      category:
        (p as { category?: string }).category ||
        (p.handle.includes("rm") || p.handle.includes("formal")
          ? "Formal"
          : "Luxury Pret"),
      description: `${p.alt}. Crafted from premium fabrics with bespoke hand embroidery, fine zardozi detailing, and artisanal tailoring.`,
      inStock: true,
      sizes: (p as { sizes?: string[] }).sizes || ["XS", "S", "M", "L", "XL"],
      fabric: (p as { fabric?: string }).fabric || "Pure Silk / Chiffon",
      sku: `SLH-${p.handle.toUpperCase()}`,
      dupattaOptions: (p as { dupattaOptions?: string[] }).dupattaOptions,
      adOnOptions: (p as { adOnOptions?: string[] }).adOnOptions,
      variants: (p as { variants?: unknown[] }).variants,
    }));

    // Batch insert in chunks of 100
    for (let i = 0; i < products.length; i += 100) {
      await ProductModel.insertMany(products.slice(i, i + 100), {
        ordered: false,
      }).catch(() => {}); // ignore duplicate errors
    }
    console.log(`✅ Seeded ${products.length} products`);
  } catch (err) {
    console.error("⚠️ Product seed error:", err);
  }
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
  const count = await ContactMessageModel.countDocuments();
  if (count > 0) return;

  console.log("🌱 Seeding contact messages...");
  const messages = [
    {
      id: "msg-1", name: "Mahnoor Tariq", email: "mahnoor@example.com",
      phone: "+92 333 4567890", subject: "Bridal Customization Appointment",
      message: "Hi, I am interested in customizing the Husan Ara Bridal dress for my wedding in December.",
      status: "read", replyNotes: "Customer invited to MM Alam studio for consultation.",
    },
    {
      id: "msg-2", name: "Zainab Chaudhry", email: "zainab.c@example.com",
      phone: "+1 312 555 0192", subject: "International Shipping to Chicago",
      message: "Hello! I live in Chicago and would like to know if the Maahi II collection can be delivered within 8 days.",
      status: "unread",
    },
  ];

  await ContactMessageModel.insertMany(messages, { ordered: false }).catch(() => {});
  console.log("✅ Seeded contact messages");
}

async function seedBlogs() {
  const count = await BlogPostModel.countDocuments();
  if (count > 0) return;

  console.log("🌱 Seeding blogs from seed data...");
  try {
    const { SEED_BLOGS } = await import("@/data/seed-blogs");
    await BlogPostModel.insertMany(SEED_BLOGS, { ordered: false }).catch(() => {});
    console.log(`✅ Seeded ${SEED_BLOGS.length} blog posts`);
  } catch (err) {
    console.error("⚠️ Blog seed error:", err);
  }
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
  seeded = true;

  await connectDB();
  await Promise.all([
    seedProducts(),
    seedOrders(),
    seedCustomers(),
    seedMessages(),
    seedBlogs(),
    seedSettings(),
  ]);
}
