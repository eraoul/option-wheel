import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Option Wheel Tracker",
  description: "Track your cash-secured puts and covered calls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
