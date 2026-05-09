import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalender Lari",
  description: "Kalender event lari terpusat",
  applicationName: "Kalender Lari",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kalender Lari",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
