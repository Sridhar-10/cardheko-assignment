import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Buying Helper",
  description: "Answer a few questions, get a confident shortlist of 4 cars.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
