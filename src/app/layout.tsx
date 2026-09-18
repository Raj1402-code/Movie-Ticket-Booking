import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBook - Premium Ticket Booking",
  description: "Book movie tickets seamlessly. A DBMS Project.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const city = cookieStore.get("city")?.value;

  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Navbar city={city} />
          <main style={{ paddingTop: "80px" }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
