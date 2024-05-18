import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

const schema = defineEntSchema({
  privateChats: defineEnt({})
    .field("support", v.boolean(), { default: false })
    .edges("users")
    .edges("messages", { ref: true }),
  users: defineEnt({})
    .field("clerkId", v.string(), { unique: true })
    .field("username", v.string(), { unique: true })
    .field("firstName", v.optional(v.string()))
    .field("lastName", v.optional(v.string()))
    .edges("privateChats")
    .edges("messages", { ref: true }),
  messages: defineEnt({})
    .field("content", v.string())
    .edge("privateChat")
    .edge("user"),
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
