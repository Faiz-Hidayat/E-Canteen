import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminSidebar } from "@/components/shared/SuperAdminSidebar";
import { Footer } from "@/components/shared/Footer";
import { AnimatedBlobs } from "@/components/shared/AnimatedBlobs";
import { PageTransition } from "@/components/shared/PageTransition";

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
    <div className="relative flex min-h-svh flex-col bg-background">
      <AnimatedBlobs />
      <SuperAdminSidebar adminName={session.user.name} />

      {/* Main content — offset for sidebar on desktop, bottom nav on mobile */}
      <div className="relative z-10 flex flex-1 flex-col md:ml-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/30 bg-white/70 px-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-200/50">
              <span className="text-base">⚡</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                Super Admin
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>

        <Footer />
      </div>
    </div>
  );
}
