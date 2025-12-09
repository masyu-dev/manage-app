import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Manage App',
  description: 'Shift management and budgeting app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className={`${inter.className}`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
