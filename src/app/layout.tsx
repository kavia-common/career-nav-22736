import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Navigator",
  description: "Career navigation dashboard and onboarding experience."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
