import { cn } from "~/lib/utils";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = (
  {
    ref,
    className,
    type,
    ...props
  }: InputProps & {
    ref: React.RefObject<HTMLInputElement>;
  }
) => {
  return (
    <input
      type={type}
      className={cn(
        "bg-input text-destructive-foreground ring-offset-background placeholder:text-secondary-foreground flex h-14 w-full rounded-xs px-3 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
};
Input.displayName = "Input";

export { Input };
