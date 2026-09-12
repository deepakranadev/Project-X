import { Inter } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";
import { Toaster } from "@/shared/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "PT Forge",
    template: "%s · PT Forge",
  },
  description: "Create accurate BGMI points tables quickly, directly in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
