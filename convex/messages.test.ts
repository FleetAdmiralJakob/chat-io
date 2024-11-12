/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const CHAT_ID = "1234567";
const TOKEN_ID_SARAH = "abcdefgh";
const TOKEN_ID_TOM = "zyxwvu";

const modules = import.meta.glob("./**/*.ts");

test("sending messages in a chat with two new users", async () => {
  const t = convexTest(schema, modules);

  const asSarah = t.withIdentity({ tokenIdentifier: TOKEN_ID_SARAH });
  const asTom = t.withIdentity({ tokenIdentifier: TOKEN_ID_TOM });

  await t.mutation(api.messages.createMessage, {
    content: "Hi!",
    chatId: CHAT_ID,
  });
  const messages = await t.query(api.messages.getMessages, { chatId: CHAT_ID });
  expect(messages).toMatchObject([
    { body: "Hi!", author: "Sarah" },
    { body: "Hey!", author: "Tom" },
  ]);
});
