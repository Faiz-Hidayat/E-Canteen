import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { Footer } from "@/components/shared/Footer";
import { AnimatedBlobs } from "@/components/shared/AnimatedBlobs";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil nama tenant dari database
  let tenantName: string | null = null;
  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });
    tenantName = tenant?.name ?? null;
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <AnimatedBlobs />
      <AdminSidebar
        tenantName={tenantName}
        adminName={session.user.name}
      />

      {/* Main content — offset for sidebar on desktop, bottom nav on mobile */}
      <div className="relative z-10 flex flex-1 flex-col md:ml-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/30 bg-white/70 px-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB26B] to-[#FF8C42] shadow-md shadow-orange-200/50">
              <span className="text-base">🍽️</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {tenantName ?? "Admin Panel"}
              </p>
              <p className="text-[10px] text-muted-foreground">Panel Penjual</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
