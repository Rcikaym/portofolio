import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { THEME_BOOT_SCRIPT } from "@/lib/session";
import "./globals.css";
import "./welcome.css";
import "./ide.css";
import "./xp.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-jetbrains",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-grotesk",
});

const title = "Fadlan Hamsyari Portfolio";
const description =
  "Software engineer in Bekasi. Web, backend, and automation. Currently tech lead on zavora.life.";

export const metadata: Metadata = {
  metadataBase: new URL("https://porto-fadlan.vercel.app"),
  title,
  description,
  authors: [{ name: "Fadlan Hamsyari Priyanto" }],
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="chooser"
      suppressHydrationWarning
      className={`${jetbrains.variable} ${grotesk.variable} h-full dark`}
    >
      <body className="min-h-full">
        <Script
          id="rcikaym-session"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
