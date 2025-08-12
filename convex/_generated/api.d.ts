/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as banking from "../banking.js";
import type * as friendBets from "../friendBets.js";
import type * as games_baccarat from "../games/baccarat.js";
import type * as games_blackjack from "../games/blackjack.js";
import type * as games_poker from "../games/poker.js";
import type * as games_quickGames from "../games/quickGames.js";
import type * as games_roulette from "../games/roulette.js";
import type * as games_slots from "../games/slots.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as router from "../router.js";
import type * as social from "../social.js";
import type * as tournaments from "../tournaments.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  banking: typeof banking;
  friendBets: typeof friendBets;
  "games/baccarat": typeof games_baccarat;
  "games/blackjack": typeof games_blackjack;
  "games/poker": typeof games_poker;
  "games/quickGames": typeof games_quickGames;
  "games/roulette": typeof games_roulette;
  "games/slots": typeof games_slots;
  http: typeof http;
  init: typeof init;
  router: typeof router;
  social: typeof social;
  tournaments: typeof tournaments;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
