import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminSidebar } from "@/components/shared/SuperAdminSidebar";
import { Footer } from "@/components/shared/Footer";

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SuperAdminSidebar adminName={session.user.name} />

      {/* Main content — offset for sidebar on desktop, bottom nav on mobile */}
      <div className="flex flex-1 flex-col md:ml-60">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-white/80 px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFB26B]">
              <span className="text-sm">🍽️</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              Super Admin Panel
            </p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
