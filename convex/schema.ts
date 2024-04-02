import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

const schema = defineEntSchema({
  privateChats: defineEnt({
    memberIds: v.array(v.string()),
  }),
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
