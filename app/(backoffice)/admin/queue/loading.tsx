import { Skeleton } from "@/components/ui/skeleton";

export default function QueueLoading() {
  return (
    <div className="space-y-6">
      {/* Gradient header skeleton */}
      <Skeleton className="h-36 w-full rounded-2xl" />

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Order cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-white/80 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="mt-3 h-4 w-32 rounded" />
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <Skeleton className="mt-3 h-8 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
