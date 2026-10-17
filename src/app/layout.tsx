import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metric Tracker",
  description: "Metric Tracker by Zeduchat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
