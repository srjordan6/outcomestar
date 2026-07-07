import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OutcomeStar",
    template: "%s · OutcomeStar",
  },
  description:
    "A documented record of academic, athletic, and leadership outcomes from K–12 through admission.",
  metadataBase: new URL("https://outcomestar.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        </body>
    </html>
  );
}
