import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Search benchmark 资料库",
  description: "Search API 与 Agent Search benchmark、dataset、leaderboard 资料库。",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
