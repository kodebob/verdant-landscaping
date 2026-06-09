import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { businessConfig } from "@/config/businessConfig";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: businessConfig.metaTitle,
  description: businessConfig.metaDescription,
  keywords: businessConfig.metaKeywords,
};

const brandColors = Object.fromEntries(
  Object.entries(businessConfig.colors).map(([shade, value]) => [`--brand-${shade}`, value])
) as React.CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable}`}
      style={brandColors}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
