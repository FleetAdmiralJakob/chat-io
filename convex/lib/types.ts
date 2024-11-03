import { type GenericEnt, type GenericEntWriter } from "convex-ents";
import { type CustomCtx } from "convex-helpers/server/customFunctions";
import { type TableNames } from "../_generated/dataModel";
import { type entDefinitions } from "../schema";
import { type mutation, type query } from "./functions";

export type QueryCtx = CustomCtx<typeof query>;
export type MutationCtx = CustomCtx<typeof mutation>;

export type Ent<TableName extends TableNames> = GenericEnt<
  typeof entDefinitions,
  TableName
>;
export type EntWriter<TableName extends TableNames> = GenericEntWriter<
  typeof entDefinitions,
  TableName
>;
