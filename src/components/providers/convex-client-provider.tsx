"use client";
import { type ReactNode } from "react";
import { ConvexReactClient, useQueries } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { env } from "~/env";
import { useAuth } from "@clerk/nextjs";
import { makeUseQueryWithStatus } from "convex-helpers/react";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
