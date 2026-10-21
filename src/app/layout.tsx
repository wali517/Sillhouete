import type { Metadata, Viewport } from "next";
import { Halant } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";
import { StoreProvider } from "@/components/providers/StoreProvider";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import FloatingWidgets from "@/components/layout/FloatingWidgets";

const halant = Halant({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-halant", display: "swap" });

export const metadata: Metadata = {
  title: `${SITE.title} – ${SITE.name}`,
  description: SITE.description,
  openGraph: { title: SITE.title, description: SITE.description, siteName: SITE.name, type: "website" },
};
export const viewport: Viewport = { themeColor: "#111111" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={halant.variable}>
      <body>
        <StoreProvider>
          <AnnouncementBar />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <NewsletterPopup />
          <WhatsAppButton />
          <FloatingWidgets />
        </StoreProvider>
      </body>
    </html>
  );
}
