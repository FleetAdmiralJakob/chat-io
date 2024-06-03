import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

export const subscription = v.object({
  endpoint: v.string(),
  expirationTime: v.optional(v.number()),
  auth: v.string(),
  p256dh: v.string(),
});

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
    .edges("messages", { ref: true })
    .edge("notificationSubscription", { optional: true }),
  messages: defineEnt({})
    .field("content", v.string())
    .field("deleted", v.boolean(), { default: false })
    .edge("privateChat")
    .edge("user"),
  notificationSubscriptions: defineEnt({ subscription }).edge("user"),
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
