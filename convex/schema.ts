import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

export const status = v.union(
  v.literal("pending"),
  v.literal("rejected"),
  v.literal("expired"),
);

const schema = defineEntSchema({
  privateChats: defineEnt({})
    .field("support", v.boolean(), { default: false })
    .edges("users")
    .edges("messages", { ref: true })
    .edges("clearRequests", { ref: true }),

  users: defineEnt({})
    .field("clerkId", v.string(), { unique: true })
    .field("username", v.string(), { unique: true })
    .field("firstName", v.optional(v.string()))
    .field("email", v.optional(v.string()))
    .field("lastName", v.optional(v.string()))
    .edges("privateChats")
    .edges("messages", { ref: true })
    .edges("clearRequests", { ref: true })
    .edges("readMessages", {
      to: "messages",
      inverseField: "readBy",
      table: "readMessages",
    }),

  clearRequests: defineEnt({})
    .field("status", status)
    .edge("user")
    .edge("privateChat"),

  messages: defineEnt({})
    .field("content", v.string())
    .field("deleted", v.boolean(), { default: false })
    .edge("privateChat")
    .edge("user")
    .edges("readBy", {
      to: "users",
      inverseField: "readMessages",
      table: "readMessages",
    }),
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
