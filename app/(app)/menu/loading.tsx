import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div className="space-y-6">
      {/* Hero + Wallet: stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-32 rounded-[32px] lg:col-span-3" />
        <Skeleton className="h-40 rounded-[32px] lg:col-span-2" />
      </div>

      {/* Search bar skeleton */}
      <Skeleton className="h-14 w-full rounded-full" />

      {/* Category pills skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Marquee skeleton */}
      <Skeleton className="h-10 w-full rounded-2xl" />

      {/* Section heading */}
      <Skeleton className="h-6 w-40 rounded" />

      {/* Menu grid skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border border-gray-100 bg-white p-2.5">
            <Skeleton className="mb-3 aspect-square w-full rounded-4xl" />
            <div className="space-y-2 px-1.5 pb-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
