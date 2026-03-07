export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 text-white shadow-lg shadow-blue-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">📊</div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="mt-1 text-sm text-white/80">
          Lihat rekapitulasi pendapatan dan produk terjual
        </p>
      </div>

      {/* Coming Soon */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-white/60 py-20 text-center backdrop-blur-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner">
          <span className="text-4xl">🚧</span>
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">Segera Hadir</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Fitur laporan sedang dikembangkan. Nantikan update selanjutnya ya!
        </p>
      </div>
    </div>
  );
}
