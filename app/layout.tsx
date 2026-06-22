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
        <footer className="mt-24 border-t border-rule">
          <div className="mx-auto max-w-page px-6 py-8 flex items-baseline justify-between">
            <span className="font-display font-semibold tracking-tight">
              OutcomeStar
            </span>
            <span className="text-xs text-ink-fade">
              © {new Date().getFullYear()} SRJ Consulting Services
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
