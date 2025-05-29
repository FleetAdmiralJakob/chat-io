import { cn } from "~/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-secondary-foreground dark:bg-secondary animate-pulse rounded-md",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
