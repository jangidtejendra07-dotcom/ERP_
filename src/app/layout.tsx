import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import { AuthProvider } from "@/features/auth/AuthProvider";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Inventory, sales and vendor management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}