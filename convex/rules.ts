import { entDefinitions } from "./schema";
import { addEntRules } from "convex-ents";
import { QueryCtx } from "./types";

export function getEntDefinitionsWithRules(
  ctx: QueryCtx,
): typeof entDefinitions {
  return addEntRules(entDefinitions, {
    privateChats: {
      read: async (chat) => {
        const user = await ctx.auth.getUserIdentity();
        return chat.memberIds.some(
          (memberId) => user?.tokenIdentifier === memberId,
        );
      },
    },
  });
}
