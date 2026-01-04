import { observer } from "@legendapp/state/react";
import { cn } from "~/lib/utils";
import { devMode$ } from "~/states";

export const DevMode = observer(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <div
        className={cn("absolute top-0 left-0 hidden", className, {
          block: devMode$.get(),
        })}
      >
        {children}
      </div>
    );
  },
);
