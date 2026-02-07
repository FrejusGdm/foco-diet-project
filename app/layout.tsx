import type { Metadata } from "next";
import Providers from "@/components/providers/ConvexClientProvider";
import Header from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foco Diet Planner",
  description:
    "Plan your meals at Foco based on your calorie goals. Smart meal planning for Downwood dining services.",
  keywords: ["meal planning", "calorie tracking", "foco", "dining", "diet"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
