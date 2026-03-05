import Script from "next/script";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/shared/Navbar";
import { BottomNav } from "@/components/shared/BottomNav";
import { Footer } from "@/components/shared/Footer";
import { CartFAB } from "@/components/shared/CartFAB";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar userName={session?.user?.name} isLoggedIn={isLoggedIn} />

      {/* Main content — extra bottom padding for mobile bottom nav */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      <Footer />
      <BottomNav isLoggedIn={isLoggedIn} />
      <CartFAB />

      {/* Midtrans Snap JS — hanya di layout user */}
      <Script
        src={
          process.env.NODE_ENV === "production"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
    </div>
  );
}
