import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";
import { Toaster } from "@/shared/ui/sonner";

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
      <body>
        {children}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
