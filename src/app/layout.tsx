import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/data/site";
import { StoreProvider } from "@/components/providers/StoreProvider";
import StoreLayoutWrapper from "@/components/layout/StoreLayoutWrapper";

export const metadata: Metadata = {
  title: `${SITE.title} – ${SITE.name}`,
  description: SITE.description,
  icons: {
    icon: "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1_32x32.png?v=1744702089",
    shortcut: "https://sillhouete.com/cdn/shop/files/sillhouete_logo_1_32x32.png?v=1744702089",
  },
  openGraph: { title: SITE.title, description: SITE.description, siteName: SITE.name, type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Halant:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-serif antialiased">
        <StoreProvider>
          <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
