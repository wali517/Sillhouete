async function runTests() {
  const BASE = "http://localhost:3000";
  console.log("=========================================");
  console.log("   SILLHOUETE E2E SYSTEM VERIFICATION   ");
  console.log("=========================================\n");

  let passCount = 0;
  let failCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passCount++;
    } catch (err) {
      console.error(`[FAIL] ${name} ->`, err.message);
      failCount++;
    }
  }

  // 1. Storefront Pages
  const pages = [
    { path: "/", title: "Homepage" },
    { path: "/collections/bridal-dresses", title: "Bridal Dresses Collection" },
    { path: "/collections/sale-1", title: "Sale Collection" },
    { path: "/collections/formal-dresses", title: "Formals Collection" },
    { path: "/products/iris-rm-03", title: "Product Detail (Iris RM 03)" },
    { path: "/cart", title: "Shopping Cart Page" },
    { path: "/checkout", title: "Direct Stripe Checkout Page" },
    { path: "/pages/contact-us", title: "Contact Us Page" },
    { path: "/pages/brand-story", title: "Brand Story Page" },
    { path: "/pages/shipping-policy", title: "Shipping Policy Page" },
    { path: "/pages/policies", title: "Policies & Returns Page" },
    { path: "/pages/faqs", title: "FAQs Page" },
    { path: "/pages/spot", title: "Spotted In Sillhouete Page" },
    { path: "/blogs/news", title: "Blog Editorial News Index" },
    { path: "/blogs/news/muslim-wedding-rituals", title: "Blog Article Reader" },
    { path: "/account", title: "Customer Account Page" },
    { path: "/admin/login", title: "Admin Login Page" },
    { path: "/admin", title: "Admin Dashboard Page" },
    { path: "/admin/products", title: "Admin Products Catalog" },
    { path: "/admin/orders", title: "Admin Orders Management" },
    { path: "/admin/customers", title: "Admin Customers Management" },
    { path: "/admin/messages", title: "Admin Inquiries Management" },
    { path: "/admin/blogs", title: "Admin Blogs Management" },
    { path: "/admin/settings", title: "Admin Website Settings" },
  ];

  for (const p of pages) {
    await test(`Page: ${p.title} (${p.path})`, async () => {
      const res = await fetch(`${BASE}${p.path}`);
      if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 50) throw new Error("Empty response");
    });
  }

  // 2. API: Contact Us Form Submission
  let testMsgId = "";
  await test("API: Submit Contact Us Form (/api/contact)", async () => {
    const res = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer Sarah",
        email: "sarah.test@example.com",
        phone: "+92 331 9998877",
        subject: "Bridal Inquiry Test",
        message: "Testing bridal appointment booking through contact form.",
      }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.message?.id) throw new Error("Invalid response");
    testMsgId = data.message.id;
  });

  // 3. API: Verify Contact Message in Admin Listing
  await test("API: Get Inquiries List (/api/contact)", async () => {
    const res = await fetch(`${BASE}/api/contact`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.messages)) throw new Error("Messages not an array");
    const found = data.messages.find((m) => m.id === testMsgId);
    if (!found) throw new Error("Submitted message not found in database");
  });

  // 4. API: Update Message Status in Admin
  await test("API: Update Inquiry Status (/api/contact/[id])", async () => {
    const res = await fetch(`${BASE}/api/contact/${testMsgId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "replied",
        replyNotes: "Called client on WhatsApp to confirm bridal studio visit.",
      }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.message.status !== "replied") throw new Error("Status not updated");
  });

  // 5. API: Stripe Direct Payment Intent Creation
  await test("API: Direct Stripe Payment Intent (/api/stripe/create-payment-intent)", async () => {
    const res = await fetch(`${BASE}/api/stripe/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 44900,
        currency: "pkr",
        customerEmail: "sarah.test@example.com",
        items: [{ id: "iris-rm-03", title: "Iris", quantity: 1 }],
      }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.clientSecret) throw new Error("No clientSecret returned");
  });

  // 6. API: Complete Direct Checkout Order Creation
  let createdOrderId = "";
  await test("API: Create Direct Checkout Order (/api/orders)", async () => {
    const res = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddress: {
          firstName: "Sarah",
          lastName: "Ahmed",
          email: "sarah.ahmed@example.com",
          phone: "+92 300 8765432",
          address: "House 15, Sector F, DHA Phase 6",
          city: "Lahore",
          state: "Punjab",
          postalCode: "54000",
          country: "Pakistan",
        },
        items: [
          {
            id: "iris-rm-03",
            handle: "iris-rm-03",
            title: "Iris",
            price: 44900,
            size: "M",
            quantity: 1,
            image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-iris-royal-blue-intricate-embroidery.jpg?v=1776742287",
          },
        ],
        subtotal: 44900,
        shipping: 0,
        discount: 0,
        total: 44900,
        currency: "PKR",
        paymentMethod: "stripe",
        paymentStatus: "paid",
        notes: "Please pack with extra tissue lining.",
        stripePaymentIntentId: "pi_test_stripe_verified_984",
      }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.order?.id) throw new Error("Order creation failed");
    createdOrderId = data.order.id;
  });

  // 7. Verify Order Confirmation Page Renders
  await test(`Page: Order Confirmation (${createdOrderId})`, async () => {
    const res = await fetch(`${BASE}/order-confirmation/${createdOrderId}`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const html = await res.text();
    if (!html.includes("Sarah")) throw new Error("Customer name not on confirmation");
  });

  // 8. API: Verify Order Status Management in Admin
  await test("API: Update Order Status (/api/orders/[id])", async () => {
    const res = await fetch(`${BASE}/api/orders/${createdOrderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "shipped",
        trackingNumber: "TCS-99887766",
        courier: "TCS Courier",
      }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.order.status !== "shipped") throw new Error("Order status not updated");
  });

  // 9. API: Customers List Records New Customer
  await test("API: Customers List (/api/customers)", async () => {
    const res = await fetch(`${BASE}/api/customers`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.customers)) throw new Error("Customers not array");
    const found = data.customers.find((c) => c.email.toLowerCase() === "sarah.ahmed@example.com");
    if (!found) throw new Error("New customer record was not automatically tracked");
  });

  // 10. API: Admin Authentication
  await test("API: Admin Authentication (/api/admin/auth)", async () => {
    const res = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "admin123" }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Admin login failed with default password");
  });

  // 11. API: Product Management CRUD
  let createdProdId = "";
  await test("API: Create Product in Admin (/api/products)", async () => {
    const res = await fetch(`${BASE}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Noor Bridal Peshwas",
        price: 89000,
        category: "Bridal",
        description: "Bespoke handcrafted gold peshwas with antique dabka work.",
        image: "https://sillhouete.com/cdn/shop/files/sillhouete-formal-dress-meraki-light-grey-sequins.jpg?v=1769691351",
        sizes: ["XS", "S", "M", "L", "XL", "Custom Size"],
      }),
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.product?.id) throw new Error("Product creation failed");
    createdProdId = data.product.id;
  });

  await test("API: Delete Product in Admin (/api/products/[id])", async () => {
    const res = await fetch(`${BASE}/api/products/${createdProdId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Product deletion failed");
  });

  // 12. Cleanup test contact message
  await fetch(`${BASE}/api/contact/${testMsgId}`, { method: "DELETE" });

  console.log("\n=========================================");
  console.log(`   TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED   `);
  console.log("=========================================\n");

  if (failCount > 0) process.exit(1);
}

runTests();
