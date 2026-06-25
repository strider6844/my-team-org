import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TopNav } from "./top-nav";

export const metadata: Metadata = {
  title: "my-team-org — Team Operations",
  description: "Shared operational record tracker for the team.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900 min-h-screen">
        <Providers>
          <TopNav />
          <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
