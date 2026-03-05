import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-10">
      {/* Active orders section */}
      <section className="space-y-4">
        <Skeleton className="h-7 w-44 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-3xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-0.5 w-6 self-center rounded" />
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-0.5 w-6 self-center rounded" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
              <Skeleton className="h-6 w-24 rounded" />
            </div>
          </div>
        ))}
      </section>

      {/* Order history section */}
      <section className="space-y-3">
        <Skeleton className="h-7 w-48 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
