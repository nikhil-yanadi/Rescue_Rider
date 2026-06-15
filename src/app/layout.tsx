import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rescue Rider — Rescuing The Nation",
  description:
    "Rescue Rider is a safety platform that connects people in danger with nearby verified delivery riders for fast emergency response.",
  keywords: ["emergency", "rescue", "safety", "rider", "help"],
  openGraph: {
    title: "Rescue Rider — Rescuing The Nation",
    description: "Quick emergency help from nearby verified riders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-brand-dark text-gray-900 dark:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
