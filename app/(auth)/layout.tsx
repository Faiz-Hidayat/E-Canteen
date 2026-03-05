import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-Canteen — Masuk atau Daftar",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-linear-to-br from-[#FFF8DC] via-[#FAFAFA] to-[#FFE8CC] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFB26B] shadow-md">
            <span className="text-2xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#333333]">
            E-Canteen
          </h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Pre-Order Kantin Sekolah
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
