import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SmartFinance - AI-Powered Personal Finance Assistant",
  description: "Analyze spending patterns, predict future expenses, and get AI-powered financial advice with SmartFinance.",
  keywords: "finance, AI, machine learning, budgeting, expenses, savings, financial planning",
  authors: [{ name: "SmartFinance Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} font-sans antialiased bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
