import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "./providers";
import { PageViewTracker } from "@/components/PageViewTracker";
import { AppHeader } from "@/components/ui/AppHeader";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Complete the Look · DRIP",
  description: "A full outfit for your occasion, within your budget.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${plexMono.variable} ${serif.variable} antialiased`}
    >
      <body>
        <Providers>
          <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-bg shadow-[0_0_30px_rgba(0,0,0,0.06)]">
            <Suspense fallback={<div className="h-14 border-b border-line/70" />}>
              <AppHeader />
            </Suspense>
            {children}
            <Suspense>
              <PageViewTracker />
            </Suspense>
          </div>
        </Providers>
      </body>
    </html>
  );
}
