"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "~/lib/utils";
import { Check } from "lucide-react";
import * as React from "react";

const Checkbox = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer border-primary bg-primary data-[state=checked]:bg-primary data-[state=checked]:text-foreground h-4 w-4 shrink-0 border shadow-sm focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
