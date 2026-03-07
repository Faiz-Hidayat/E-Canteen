import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* Profile card skeleton */}
      <div className="rounded-3xl border border-gray-100 bg-white/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        </div>
      </div>

      {/* Wallet card skeleton */}
      <Skeleton className="h-40 w-full rounded-[32px]" />

      {/* Top-up form skeleton */}
      <div className="space-y-3 rounded-3xl border border-gray-100 bg-white/80 p-6 backdrop-blur-sm">
        <Skeleton className="h-5 w-28 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>

      {/* Balance history skeleton */}
      <div className="space-y-3 rounded-3xl border border-gray-100 bg-white/80 p-6 backdrop-blur-sm">
        <Skeleton className="h-5 w-36 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Logout button skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
