import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getCurrentPractice } from "@/lib/practice-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamic metadata based on current practice
function generateMetadata(): Metadata {
  const practice = getCurrentPractice();
  
  if (practice.id === 'spinealign') {
    return {
      title: "SpineAlign Center - AI Wellness Assistant | Dr. Sherra Conde",
      description: "Experience holistic wellness care with Dr. Sherra Conde in Fayetteville, GA. Schedule your wellness appointment with our AI assistant.",
      keywords: ["wellness", "chiropractic", "holistic care", "AI assistant", "Dr. Sherra Conde", "Fayetteville GA", "natural healing"],
      authors: [{ name: "SpineAlign Center" }],
      openGraph: {
        title: "SpineAlign Center - AI Wellness Assistant",
        description: "Holistic wellness care with AI-powered appointment scheduling",
        type: "website",
      },
    };
  } else {
    return {
      title: "Smith Chiropractic - AI Assistant | Dr. John Smith",
      description: "Experience professional chiropractic care with Dr. John Smith in Scottsdale, AZ. Schedule your appointment with our AI chiropractic assistant.",
      keywords: ["chiropractic", "spinal care", "AI assistant", "Dr. John Smith", "Scottsdale AZ", "back pain"],
      authors: [{ name: "Smith Chiropractic" }],
      openGraph: {
        title: "Smith Chiropractic - AI Assistant",
        description: "Professional chiropractic care with AI-powered appointment scheduling",
        type: "website",
      },
    };
  }
}

export const metadata: Metadata = generateMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
