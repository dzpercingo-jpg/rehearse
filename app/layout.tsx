import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rehearse — practice the conversation before you have it",
  description:
    "Voice-AI roleplay for the toughest conversations: asking for a raise, ending a relationship, pitching investors, advocating to a doctor. Built on ElevenLabs Speech Engine.",
  openGraph: {
    title: "Rehearse — practice the conversation before you have it",
    description:
      "Voice-AI roleplay for the toughest conversations. Built on ElevenLabs Speech Engine.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
