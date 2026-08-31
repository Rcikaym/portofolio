import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { THEME_BOOT_SCRIPT } from "@/lib/session";
import "./globals.css";
import "./welcome.css";
import "./ide.css";

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

export const metadata: Metadata = {
  title: "Fadlan Hamsyari — Portofolio",
  description:
    "Portofolio for Fadlan Hamsyari Priyanto, junior software engineer in Bekasi. Unix shell or editor. Public work as Rcikaym on GitHub.",
  authors: [{ name: "Fadlan Hamsyari Priyanto" }],
  openGraph: {
    title: "Fadlan Hamsyari — Portofolio",
    description:
      "Portofolio for Fadlan Hamsyari Priyanto. Unix shell or editor. Public work as Rcikaym on GitHub.",
    type: "website",
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
