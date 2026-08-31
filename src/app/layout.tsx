import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Fadlan Hamsyari — software engineer",
  description:
    "Unix-flavoured portfolio for Fadlan Hamsyari, software engineer in Bekasi. Public work as Rcikaym on GitHub.",
  authors: [{ name: "Fadlan Hamsyari Priyanto" }],
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="terminal"
      className={`${jetbrains.variable} ${jetbrains.className} h-full dark`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
