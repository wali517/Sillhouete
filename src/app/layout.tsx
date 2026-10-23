import type { Metadata, Viewport } from "next";
import { Halant } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";
import { StoreProvider } from "@/components/providers/StoreProvider";
import StoreLayoutWrapper from "@/components/layout/StoreLayoutWrapper";

const halant = Halant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-halant",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SITE.title} – ${SITE.name}`,
  description: SITE.description,
  openGraph: { title: SITE.title, description: SITE.description, siteName: SITE.name, type: "website" },
};
export const viewport: Viewport = { themeColor: "#111111" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={halant.variable}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
