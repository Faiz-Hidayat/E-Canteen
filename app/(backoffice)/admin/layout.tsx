import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { Footer } from "@/components/shared/Footer";

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
    <div className="flex min-h-svh flex-col bg-background">
      <AdminSidebar
        tenantName={tenantName}
        adminName={session.user.name}
      />

      {/* Main content — offset for sidebar on desktop, bottom nav on mobile */}
      <div className="flex flex-1 flex-col md:ml-60">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-white/80 px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFB26B]">
              <span className="text-sm">🍽️</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {tenantName ?? "Admin Panel"}
              </p>
            </div>
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
