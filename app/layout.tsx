import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BackgroundDecor } from "@/components/BackgroundDecor";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anime Studio — turn your photo into an anime character",
  description:
    "A premium, effortless anime-style converter. Upload a photo, pick a style, fine-tune, and compare before & after — no account needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BackgroundDecor />
        {children}
      </body>
    </html>
  );
}
