"use client";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f615.svg"
        alt=""
        className="h-16 w-16 opacity-70"
      />
      <h2 className="text-lg font-extrabold text-gray-800">
        Duh, pesanan gagal dimuat.
      </h2>
      <p className="max-w-xs text-sm text-gray-500">
        {error.message ||
          "Coba refresh ya, mungkin koneksi ke kantin lagi gangguan."}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
      >
        Coba Lagi
      </button>
    </div>
  );
}
