<img width="1392" alt="image" src="https://github.com/user-attachments/assets/3ae685cd-0a61-4ee2-b996-1e9cf73c4d6f">

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## Telemetry and E2EE Safety

When working on chat encryption and related flows, do not send message plaintext (or other sensitive content) to telemetry.

### Policy

- Use `reportSafeError(context, error, extra?)` from `src/lib/safe-error-reporting.ts`.
- Log only safe metadata (for example: `errorName`, `chatId`, operation name).
- Do not pass message text, form values, decrypted content, or raw error payloads that may include sensitive data.

### ESLint Guardrail

Direct imports of `@sentry/nextjs` are blocked in E2EE-sensitive files:

- `src/app/(internal-sites)/chats/**`
- `src/components/encryption-key-bootstrap.tsx`
- `src/lib/crypto.ts`
- `src/lib/hooks.ts`

If you need Sentry in those files, route the event through `reportSafeError` instead.

### Examples

Good:

```ts
reportSafeError("Failed to send encrypted message", error, { chatId });
```

Bad:

```ts
Sentry.captureException(error);
console.error("Failed to send encrypted message", {
  error,
  message: values.message,
});
```
