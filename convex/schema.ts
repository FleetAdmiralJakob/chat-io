import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

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
    .edges("reactions", { ref: true })
    .edges("privateChats")
    .edges("messages", { ref: true })
    .edges("clearRequests", { ref: true })
    .edges("readMessages", {
      to: "messages",
      inverseField: "readBy",
      table: "readMessages",
    })
    .edges("readRequests", {
      to: "clearRequests",
      inverseField: "readBy",
      table: "readRequests",
    }),

  clearRequests: defineEnt({})
    .field(
      "status",
      v.union(v.literal("pending"), v.literal("rejected"), v.literal("expired"))
    )
    .edges("readBy", {
      to: "users",
      inverseField: "readRequests",
      table: "readRequests",
    })
    .edge("user")
    .edge("privateChat"),

  messages: defineEnt({})
    .field("content", v.string())
    .field("deleted", v.boolean(), { default: false })
    .field("modified", v.boolean(), { default: false })
    .field("forwarded", v.number(), { default: 0 })
    .field("modifiedAt", v.optional(v.string()))
    // This can't be an edge because assymetrical, self-directed, optional 1:many edges are not supported yet.
    .field("replyTo", v.optional(v.id("messages")))
    .edge("privateChat")
    .edge("user")
    .edges("reactions", { ref: true })
    .edges("readBy", {
      to: "users",
      inverseField: "readMessages",
      table: "readMessages",
    }),

  reactions: defineEnt({})
    .field("emoji", v.string())
    .edge("user")
    .edge("message"),
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
