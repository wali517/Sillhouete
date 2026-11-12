import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/data/site";
import { StoreProvider } from "@/components/providers/StoreProvider";
import StoreLayoutWrapper from "@/components/layout/StoreLayoutWrapper";
import { getSettings, getNavigationMenu } from "@/lib/db";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let publicSettings = null;
  let initialNav = undefined;

  try {
    const [settings, nav] = await Promise.all([
      getSettings(),
      getNavigationMenu(),
    ]);
    // Strip sensitive secrets before passing settings to client StoreProvider
    const {
      stripeSecretKey: _sk,
      adminPassword: _ap,
      smtpPass: _sp,
      ...safeSettings
    } = settings as typeof settings & { adminPassword?: string; smtpPass?: string };
    publicSettings = safeSettings;
    initialNav = nav;
  } catch {
    // Fallback to defaults if DB is temporarily unavailable
  }

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
        <StoreProvider initialSettings={publicSettings}>
          <StoreLayoutWrapper initialNav={initialNav}>{children}</StoreLayoutWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
