/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chats from "../chats.js";
import type * as clearRequests from "../clearRequests.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_types from "../lib/types.js";
import type * as lib_validators from "../lib/validators.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as push from "../push.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chats: typeof chats;
  clearRequests: typeof clearRequests;
  constants: typeof constants;
  crons: typeof crons;
  "lib/functions": typeof lib_functions;
  "lib/types": typeof lib_types;
  "lib/validators": typeof lib_validators;
  messages: typeof messages;
  notifications: typeof notifications;
  push: typeof push;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
