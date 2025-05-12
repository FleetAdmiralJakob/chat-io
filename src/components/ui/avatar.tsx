"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "~/lib/utils";
import { usePathname } from "next/navigation";
import * as React from "react";

const Avatar = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    ref: React.RefObject<React.ElementRef<typeof AvatarPrimitive.Root>>;
  }
) => {
  const pathname = usePathname();

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-14 w-14 shrink-0 overflow-hidden rounded-full",
        className,
        {
          "h-11 w-11 lg:h-14 lg:w-14": pathname.startsWith("/chats/"),
        }
      )}
      {...props}
    />
  );
};
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    ref: React.RefObject<React.ElementRef<typeof AvatarPrimitive.Image>>;
  }
) => (<AvatarPrimitive.Image
  ref={ref}
  className={cn("aspect-square h-full w-full", className)}
  {...props}
/>);
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    ref: React.RefObject<React.ElementRef<typeof AvatarPrimitive.Fallback>>;
  }
) => (<AvatarPrimitive.Fallback
  ref={ref}
  className={cn(
    "flex h-full w-full items-center justify-center rounded-full bg-black",
    className
  )}
  {...props}
/>);
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
