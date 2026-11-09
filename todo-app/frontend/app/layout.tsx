import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Same title/meta as the Vite index.html (<title>My To-Do List</title>,
// viewport meta). This is a Server Component — no browser APIs here.
export const metadata: Metadata = {
  title: "My To-Do List",
  description: "My To-Do List — tasks stored in FastAPI + PostgreSQL.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
