import { Skeleton } from "@/components/ui/skeleton";

export default function MenusLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div>
        <Skeleton className="h-8 w-36 rounded" />
        <Skeleton className="mt-2 h-4 w-72 rounded" />
      </div>

      {/* Add button skeleton */}
      <Skeleton className="h-9 w-44 rounded-md" />

      {/* Menu grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-gray-100 bg-white"
          >
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
