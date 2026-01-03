import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Messages skeleton */}
        <div className="space-y-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
