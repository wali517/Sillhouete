"use client";

import { usePathname } from "next/navigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import FloatingWidgets from "@/components/layout/FloatingWidgets";

export default function StoreLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isIsolatedPage =
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/order-confirmation");

  if (isIsolatedPage) {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
      <NewsletterPopup />
      <WhatsAppButton />
      <FloatingWidgets />
    </>
  );
}
