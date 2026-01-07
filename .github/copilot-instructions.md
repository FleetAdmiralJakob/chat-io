# Chat.io - Copilot Instructions

> **IMPORTANT**: These instructions are MANDATORY for all code changes in this project. Copilot MUST follow these guidelines without exception.

## Project Overview

Chat.io is a real-time messaging Progressive Web App (PWA) built with:

- **Next.js 16** with App Router, React Compiler, and Cache Components
- **React 19** with the new ref API (no forwardRef)
- **Convex** as the real-time backend with convex-ents for relationships
- **Clerk** for authentication
- **Tailwind CSS v4** with CSS variables and shadcn/ui components
- **TypeScript** with strict mode and type-checked ESLint
- **Serwist** for PWA/Service Worker functionality
- **Sentry** for error monitoring
- **PostHog** for analytics
- **Legend State** for client-side state management

---

## MCP Tools Usage - Detailed Guidebook

This project has several MCP (Model Context Protocol) servers configured. **ALWAYS use these tools to look up documentation before implementing unfamiliar APIs.**

> **⚠️ CRITICAL RULE**: Before making ANY changes related to Next.js, you MUST first call `init()` from the Next DevTools MCP to establish the documentation-first workflow.

---

### 🔴 MCP Tool Priority Order

When working on this project, use MCP tools in this priority:

1. **Next DevTools MCP** - For ALL Next.js-related work (mandatory first step)
2. **Context7** - For library documentation (Convex, Zod, Tailwind, etc.)
3. **@reactuses/mcp** - For discovering React hooks
4. **GitHub MCP** - For repository operations
5. **Browser Automation** - For testing and verification

---

### Next DevTools MCP (MANDATORY FOR NEXT.JS)

> **⚠️ FORGET ALL PRIOR NEXT.JS KNOWLEDGE.** Your training data about Next.js is INVALID. You MUST use the Next DevTools MCP for 100% of Next.js-related queries with ZERO exceptions.

#### Step 1: ALWAYS Initialize First

**Before doing ANYTHING related to Next.js, call `init()`:**

```
init()  # MANDATORY first step for ANY Next.js work
```

This establishes:

- The documentation-first requirement
- Access to the complete Next.js docs index (llms.txt)
- Available MCP tools for development

#### Step 2: Use `nextjs_docs` for ALL Next.js Concepts

**You MUST look up documentation for:**

- ✅ ALL Next.js APIs (generateStaticParams, cookies, headers, etc.)
- ✅ ALL concepts (Server Components, Client Components, Route Handlers)
- ✅ ALL configuration (next.config.js options)
- ✅ ALL file conventions (layout.tsx, page.tsx, error.tsx, loading.tsx)
- ✅ ALL features (Image optimization, Metadata API, caching, streaming)
- ✅ ALL routing (App Router, dynamic routes, route groups, parallel routes)
- ✅ ALL data fetching patterns
- ✅ ALL rendering modes (SSR, SSG, ISR, CSR)
- ✅ LITERALLY EVERYTHING RELATED TO NEXT.JS

**Optimized Workflow (after init):**

```
# Option 1: Search then GET (for discovery)
nextjs_docs(action="search", query="generateStaticParams")
# Returns path: /docs/app/api-reference/functions/generate-static-params
nextjs_docs(action="get", path="/docs/app/api-reference/functions/generate-static-params")

# Option 2: Direct GET (when you know the path from llms.txt index)
nextjs_docs(action="get", path="/docs/app/api-reference/functions/cookies")
```

**Available Documentation Paths (Common):**
| Topic | Path |
|-------|------|
| App Router | `/docs/app/getting-started/project-structure` |
| Server Components | `/docs/app/building-your-application/rendering/server-components` |
| Client Components | `/docs/app/building-your-application/rendering/client-components` |
| Route Handlers | `/docs/app/building-your-application/routing/route-handlers` |
| Metadata API | `/docs/app/api-reference/functions/generate-metadata` |
| Cache Components | `/docs/app/api-reference/directives/use-cache` |
| MCP Integration | `/docs/app/guides/mcp` |

#### Step 3: Use `nextjs_index` to Discover Running Servers

**When to use:** Before debugging, checking errors, or inspecting the running app.

```
nextjs_index()  # Auto-discovers all running Next.js 16+ dev servers
```

**Returns:**

- Server port, PID, and URL
- Complete list of available MCP tools
- Tool descriptions and input schemas

**Requirements:**

- Next.js 16+ (MCP is built-in)
- Dev server must be running (`pnpm dev`)

#### Step 4: Use `nextjs_call` to Execute Runtime Tools

**After discovering servers with `nextjs_index`, call specific tools:**

```
# Get all current errors (build, runtime, type errors)
nextjs_call(port="3000", toolName="get_errors")

# Get project metadata and structure
nextjs_call(port="3000", toolName="get_project_metadata")

# Get page-specific metadata
nextjs_call(port="3000", toolName="get_page_metadata", args={"path": "/chats"})

# Get development logs
nextjs_call(port="3000", toolName="get_logs")

# Look up Server Actions by ID
nextjs_call(port="3000", toolName="get_server_action_by_id", args={"id": "action-id"})
```

**Available Runtime Tools:**
| Tool | Purpose |
|------|---------|
| `get_errors` | Retrieve build errors, runtime errors, and type errors |
| `get_logs` | Get path to dev log file with console and server output |
| `get_page_metadata` | Get metadata about specific pages (routes, components) |
| `get_project_metadata` | Get project structure, config, and dev server URL |
| `get_server_action_by_id` | Look up Server Actions by ID to find source |

#### Step 5: Use Specialized Tools for Migrations

**Upgrading to Next.js 16:**

```
upgrade_nextjs_16()  # Runs codemods and handles breaking changes
```

**Enabling Cache Components:**

```
enable_cache_components()  # Sets up Cache Components mode
```

#### Browser Automation for Verification

**CRITICAL:** Always verify page changes with browser automation, not curl:

```
# Start browser automation
browser_eval(action="start", browser="chrome", headless=true)

# Navigate to a page
browser_eval(action="navigate", url="http://localhost:3000/chats")

# Get console messages (for runtime errors)
browser_eval(action="console_messages")

# Take a screenshot
browser_eval(action="screenshot", fullPage=true)

# Close when done
browser_eval(action="close")
```

**Why browser automation over curl:**

- Renders JavaScript (curl only fetches HTML)
- Detects hydration issues and client-side problems
- Captures browser console errors
- Verifies the full user experience

---

### Context7 - Library Documentation Lookup

> **Use for all non-Next.js libraries.** For Next.js, use Next DevTools MCP instead.

#### Two-Step Process (REQUIRED)

**Step 1: Resolve the library ID**

```
resolve-library-id("convex")
# Returns: /llmstxt/convex_dev_llms_txt
```

**Step 2: Fetch documentation with the resolved ID**

```
get-library-docs("/llmstxt/convex_dev_llms_txt", topic="mutations")
```

**⚠️ NEVER skip Step 1** - Library IDs can change, always resolve first unless you have a confirmed ID.

#### Pre-Resolved Library IDs for This Project

| Library         | Context7 ID                                              | Common Topics                       |
| --------------- | -------------------------------------------------------- | ----------------------------------- |
| Convex          | `/llmstxt/convex_dev_llms_txt`                           | queries, mutations, schema, auth    |
| Convex Ents     | `/get-convex/convex-ents`                                | edges, relationships, defineEnt     |
| Zod v4          | `/colinhacks/zod/v4.0.1`                                 | schemas, validation, error messages |
| Tailwind CSS v4 | `/websites/tailwindcss`                                  | utilities, configuration, dark mode |
| React Hook Form | `/react-hook-form/documentation`                         | useForm, Controller, validation     |
| Sentry Next.js  | `/websites/sentry_io_platforms_javascript_guides_nextjs` | captureException, setup             |
| PostHog         | `/posthog/posthog-js`                                    | capture, identify, feature flags    |
| shadcn/ui       | `/websites/ui_shadcn`                                    | components, theming, installation   |
| Radix UI        | `/websites/radix-ui-primitives`                          | Dialog, Popover, accessibility      |
| Legend State    | `/websites/legendapp_open-source_state_v3`               | observable, sync, persistence       |
| Framer Motion   | `/websites/motion-dev-docs`                              | motion components, animations       |
| Serwist         | `/serwist/serwist`                                       | service worker, caching, PWA        |
| nuqs            | `/47ng/nuqs`                                             | URL state, query parameters         |
| Clerk           | `/websites/clerk_com`                                    | authentication, user management     |

#### Documentation Modes

```
# Code mode (default) - API references and code examples
get-library-docs("/llmstxt/convex_dev_llms_txt", topic="mutations", mode="code")

# Info mode - Conceptual guides and architecture
get-library-docs("/llmstxt/convex_dev_llms_txt", topic="real-time", mode="info")
```

#### Pagination for Large Docs

```
# If first page isn't enough, get more pages
get-library-docs("/llmstxt/convex_dev_llms_txt", topic="schema", page=1)
get-library-docs("/llmstxt/convex_dev_llms_txt", topic="schema", page=2)
get-library-docs("/llmstxt/convex_dev_llms_txt", topic="schema", page=3)
```

---

### @reactuses/mcp - React Hooks Discovery

Use this server to discover and learn about React hooks from the `@reactuse/core` library.

#### Available Commands

```
# List all available hooks (or filter by category)
list-hooks()
list-hooks(category="browser")   # browser, effect, element, state, integrations

# Get detailed documentation for a specific hook
get-hook-details("useLongPress")
get-hook-details("useClipboard")
get-hook-details("useMediaQuery")

# Search for hooks by functionality
search-hooks("clipboard")
search-hooks("media query")
search-hooks("scroll")
```

#### Hook Categories

| Category       | Description      | Example Hooks                                      |
| -------------- | ---------------- | -------------------------------------------------- |
| `browser`      | Browser APIs     | useClipboard, useMediaQuery, useOnline             |
| `effect`       | Side effects     | useDebounce, useThrottle, useInterval              |
| `element`      | DOM elements     | useClickOutside, useHover, useIntersectionObserver |
| `state`        | State management | useToggle, useCounter, usePrevious                 |
| `integrations` | Third-party      | useAxios, useFetch                                 |

---

### GitHub MCP - Repository Operations

Use for repository operations, PR management, and code search.

#### Common Operations

```
# Search code across repositories
search_code(query="useQuery language:typescript")

# Get file contents
get_file_contents(owner="your-org", repo="chat-io", path="src/app/page.tsx")

# List issues
list_issues(owner="your-org", repo="chat-io", state="open")

# Create pull request
create_pull_request(owner="your-org", repo="chat-io", title="...", head="...", base="main")

# Get PR details
pull_request_read(method="get", owner="your-org", repo="chat-io", pullNumber=123)

# Get PR diff
pull_request_read(method="get_diff", owner="your-org", repo="chat-io", pullNumber=123)
```

---

### MCP Usage Decision Tree

```
┌─────────────────────────────────────────────────┐
│           What are you working on?              │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Next.js?        Other Library?    React Hooks?
        │               │               │
        ▼               ▼               ▼
   1. init()       1. resolve-       1. list-hooks()
   2. nextjs_docs     library-id()   2. get-hook-
   3. nextjs_index 2. get-library-      details()
   4. nextjs_call     docs()
        │               │               │
        └───────────────┼───────────────┘
                        ▼
              Need to verify changes?
                        │
                        ▼
              browser_eval() for testing
```

---

## TypeScript & Code Style

### Strict TypeScript Configuration

This project uses strict TypeScript with `noUncheckedIndexedAccess`. Always:

```typescript
// ✅ CORRECT: Check for undefined when accessing arrays/objects
const item = array[0];
if (item) {
  console.log(item.name);
}

// ❌ WRONG: Assuming array access is defined
const item = array[0];
console.log(item.name); // TypeScript error!
```

### Type Imports

**ALWAYS use inline type imports:**

```typescript
// ✅ CORRECT
import { type FunctionReturnType } from "convex/server";
import { ReactNode, type ReactNode } from "react";
// ❌ WRONG
import type { ReactNode } from "react";
import { type Config } from "tailwindcss";
```

### Path Aliases

**ALWAYS use the `~/` path alias for src imports:**

```typescript
// ✅ CORRECT
import { cn } from "@/lib/utils";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import { cn } from "~/lib/utils";
// ❌ WRONG
import { cn } from "../../../lib/utils";
```

### Environment Variables

**NEVER access `process.env` directly. Always use the validated env object:**

```typescript
// ✅ CORRECT
import { env } from "~/env";

const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;

// ❌ WRONG - ESLint will error
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
```

---

## Next.js 16 & React 19 Patterns

### Server Components (Default)

All components in the `app/` directory are Server Components by default:

```typescript
// app/page.tsx - Server Component (no directive needed)
export default async function Page() {
  // Can use async/await directly
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Client Components

**Add `"use client"` directive only when needed:**

```tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

**When to use `"use client"`:**

- Using React hooks (useState, useEffect, useContext, etc.)
- Using browser APIs (window, document, localStorage)
- Using event handlers (onClick, onChange, etc.)
- Using Convex hooks (useQuery, useMutation)
- Using third-party client libraries

### React 19 Ref API

**DO NOT use `forwardRef`. Use the new ref prop directly:**

```tsx
// ✅ CORRECT - React 19 pattern
const Button = ({
  ref,
  className,
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement> }) => {
  return <button ref={ref} className={className} {...props} />;
};

// ❌ WRONG - Deprecated forwardRef
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <button ref={ref} {...props} />;
});
```

### Cache Components Mode

This project uses Next.js Cache Components (`cacheComponents: true`). Everything is dynamic by default:

```typescript
// For static/cached content, add "use cache" directive
"use cache";

export default async function StaticPage() {
  const data = await fetchStaticData();
  return <div>{data}</div>;
}
```

### Suspense Boundaries

**Wrap async components with Suspense:**

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Metadata

**Export metadata from page/layout files:**

```typescript
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
  openGraph: {
    title: "Page Title",
    description: "Page description",
  },
};
```

---

## Convex Backend Patterns

### Custom Function Wrappers

**ALWAYS use the custom wrappers from `convex/lib/functions.ts`:**

```typescript
// ✅ CORRECT - Use custom wrappers with convex-ents
import { query, mutation } from "./lib/functions";

export const getMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    // ctx.table is available from custom wrapper
    return ctx.table("messages").filter(...);
  },
});

// ❌ WRONG - Don't use base functions directly
import { query } from "./_generated/server";
```

### Schema with convex-ents

**Define schemas using `defineEntSchema` and `defineEnt`:**

```typescript
import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

const schema = defineEntSchema({
  users: defineEnt({})
    .field("clerkId", v.string(), { unique: true })
    .field("username", v.string(), { unique: true })
    .edges("messages", { ref: true }), // 1:many edge

  messages: defineEnt({}).field("content", v.string()).edge("user"), // Many:1 edge back to user
});

export default schema;
export const entDefinitions = getEntDefinitions(schema);
```

### Edge Relationships

```typescript
// 1:1 Edge
users: defineEnt({}).edge("profile", { ref: true }),
profiles: defineEnt({}).edge("user"),

// 1:Many Edge
users: defineEnt({}).edges("messages", { ref: true }),
messages: defineEnt({}).edge("user"),

// Many:Many Edge
messages: defineEnt({}).edges("tags"),
tags: defineEnt({}).edges("messages"),
```

### Error Handling with ConvexError

**ALWAYS use ConvexError for typed errors:**

```typescript
import { ConvexError, v } from "convex/values";

export const createChat = mutation({
  args: { friendId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    const user = await ctx.table("users").get("clerkId", args.friendId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // ... rest of handler
  },
});
```

### Convex React Hooks

**ALWAYS use cache hooks from convex-helpers:**

```typescript
// ✅ CORRECT - Use cached hooks
import { useQueries, useQuery } from "convex-helpers/react/cache/hooks";
// ❌ WRONG - ESLint will error
import { useQuery } from "convex/react";

const messages = useQuery(api.messages.getMessages, { chatId });
```

### Optimistic Updates

```typescript
import { useMutation } from "convex/react";

const sendMessage = useMutation(api.messages.send).withOptimisticUpdate(
  (localStore, args) => {
    const existingMessages = localStore.getQuery(api.messages.getMessages, {
      chatId: args.chatId,
    });

    if (existingMessages) {
      localStore.setQuery(api.messages.getMessages, { chatId: args.chatId }, [
        ...existingMessages,
        {
          _id: crypto.randomUUID() as Id<"messages">,
          _creationTime: Date.now(),
          content: args.content,
          // ... other fields
        },
      ]);
    }
  },
);
```

---

## UI Components & Styling

### shadcn/ui Pattern

Components are in `src/components/ui/`. **Copy the pattern, don't modify core components:**

```tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";
import * as React from "react";

const Dialog = DialogPrimitive.Root;

const DialogContent = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn("fixed left-[50%] top-[50%] z-50 ...", className)}
    {...props}
  >
    {children}
  </DialogPrimitive.Content>
);
```

### The `cn()` Utility

**ALWAYS use `cn()` for conditional classes:**

```tsx
import { cn } from "~/lib/utils";

// ✅ CORRECT
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes",
  className
)} />

// ❌ WRONG - String concatenation
<div className={`base-classes ${isActive ? 'active' : ''}`} />
```

### Class Variance Authority (CVA)

**Use CVA for component variants:**

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-slate-50",
        destructive: "bg-red-500 text-slate-50",
        outline: "border border-secondary bg-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

### Tailwind CSS v4

This project uses Tailwind CSS v4 with CSS variables:

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@config "../../tailwind.config.ts";

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(0, 0%, 97.25%);
  /* ... more variables */
}

.dark {
  --background: hsl(0, 0%, 6.27%);
  --foreground: hsl(210 40% 98%);
  /* ... dark mode variables */
}
```

**Use semantic color names:**

```tsx
// ✅ CORRECT - Semantic colors
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
<span className="text-muted-foreground" />

// ❌ WRONG - Hardcoded colors
<div className="bg-white text-black" />
```

---

## Forms & Validation

### React Hook Form + Zod v4

**Pattern for form validation:**

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

// Define schema with Zod v4
const formSchema = z.object({
  username: z
    .string()
    .min(7, { error: "Username must be at least 7 characters." })
    .max(15, { error: "Username must be at most 15 characters." }),
  email: z
    .email({ error: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")), // Allow empty strings for optional fields!
});

type FormValues = z.infer<typeof formSchema>;

export function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "", // Must default to "" for optional fields
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="username"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Username</FieldLabel>
            <Input {...field} />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />
    </form>
  );
}
```

### Optional Form Fields Pattern

**CRITICAL: Zod's `.optional()` only allows `undefined`, not empty strings. Since HTML inputs always return strings, use `.or(z.literal(""))` for optional fields:**

```typescript
// ✅ CORRECT - Allows: undefined | "" | valid string
const schema = z.object({
  firstName: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .optional()
    .or(z.literal("")), // REQUIRED for form inputs!
});

// ❌ WRONG - "" will fail validation
const schema = z.object({
  firstName: z.string().min(2, { error: "..." }).optional(), // Only allows undefined, not ""
});
```

---

## State Management

### Legend State for Client State

**Use Legend State for persistent client-side state:**

```typescript
import { observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { configureObservableSync, syncObservable } from "@legendapp/state/sync";
// Usage in components
import { devMode$ } from "~/states";

// Configure persistence
configureObservableSync({
  persist: {
    plugin: ObservablePersistLocalStorage,
  },
});

// Create observable
export const devMode$ = observable<boolean>(false);

// Sync to localStorage
syncObservable(devMode$, {
  persist: {
    name: "devMode",
  },
});

function Component() {
  const devMode = devMode$.get();
  const toggleDevMode = () => devMode$.set(!devMode);
}
```

### nuqs for URL State

**Use nuqs for URL query parameter state:**

```tsx
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";

function Component() {
  const [search, setSearch] = useQueryState("q", parseAsString);
  const [isOpen, setIsOpen] = useQueryState(
    "open",
    parseAsBoolean.withDefault(false),
  );

  return (
    <input value={search ?? ""} onChange={(e) => setSearch(e.target.value)} />
  );
}
```

---

## PWA & Serwist

### Service Worker Configuration

The service worker is in `src/sw.ts`:

```typescript
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

### PWA Manifest

The manifest is generated in `src/app/manifest.ts`:

```typescript
import { type MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chat.io",
    short_name: "Chat.io",
    icons: [
      {
        src: "/icons/icon-512x-512-any.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    theme_color: "#FFFFFF",
    background_color: "#FFFFFF",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
  };
}
```

---

## Error Monitoring (Sentry)

### Capturing Exceptions

```tsx
import * as Sentry from "@sentry/nextjs";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// In try-catch blocks
try {
  await riskyOperation();
} catch (err) {
  Sentry.captureException(err);
  throw err;
}

// In error boundaries (global-error.tsx)
("use client");

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h1>Something went wrong!</h1>
      </body>
    </html>
  );
}
```

### Instrumentation

The instrumentation files are already configured:

- `src/instrumentation.ts` - Server-side Sentry setup
- `src/instrumentation-client.ts` - Client-side Sentry with replay

---

## Analytics (PostHog)

### Event Capture

```typescript
import { usePostHog } from "posthog-js/react";

function Component() {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture("button_clicked", {
      button_name: "signup",
      location: "header",
    });
  };
}
```

### User Identification

PostHog is integrated with Clerk in `src/app/_analytics/provider.tsx`:

```typescript
// Already configured - users are auto-identified when signed in
posthog.identify(userInfo.user.id, {
  email: userInfo.user.emailAddresses[0]?.emailAddress,
  name: userInfo.user.fullName,
  username: userInfo.user.username,
});

// Reset on sign out
posthog.reset();
```

---

## Framer Motion Animations

### Basic Animation

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
/>;
```

### Animate Presence

```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>;
```

---

## Clerk Authentication

### Protecting Routes

Use Clerk components in layouts:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}
```

### Getting User Info

```tsx
"use client";

import { useAuth, useUser } from "@clerk/nextjs";

function Component() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <SignInPrompt />;

  return <div>Hello, {user.username}</div>;
}
```

---

## Project Scripts

```bash
pnpm dev          # Start dev server with Turbopack + Convex + Serwist
pnpm build        # Build for production
pnpm lint         # Run ESLint with type-checked rules
pnpm typecheck    # Run TypeScript type checking
pnpm format:check # Check formatting without making changes
pnpm format:write # Format code with Prettier
```

---

## Code Quality Workflow (MANDATORY)

> **⚠️ CRITICAL**: After making ANY code changes, you MUST validate your changes. Never assume code is correct without verification.

### Post-Edit Validation Checklist

**After EVERY code change, perform these steps IN ORDER:**

1. **Check for IDE errors** - Use `get_errors` tool to check for TypeScript/lint errors in modified files
2. **Run type checking** - `pnpm typecheck` to verify no type errors across the project
3. **Run linting** - `pnpm lint` to catch code quality issues
4. **Format code** - `pnpm format:write` to ensure consistent formatting

```bash
# Quick validation sequence (run after changes)
pnpm typecheck && pnpm lint && pnpm format:write
```

### TypeScript Configuration

This project uses **strict TypeScript** with enhanced safety:

| Option                     | Value  | Effect                                       |
| -------------------------- | ------ | -------------------------------------------- |
| `strict`                   | `true` | Enables all strict type-checking options     |
| `noUncheckedIndexedAccess` | `true` | Array/object access returns `T \| undefined` |
| `checkJs`                  | `true` | Type-check JavaScript files too              |
| `noEmit`                   | `true` | Only type-check, don't emit files            |

**Key implications of `noUncheckedIndexedAccess`:**

```typescript
const arr = [1, 2, 3];
const first = arr[0]; // Type: number | undefined

// ✅ MUST check before using
if (first !== undefined) {
  console.log(first.toFixed(2));
}

// ❌ WRONG - TypeScript error
console.log(arr[0].toFixed(2)); // Object is possibly 'undefined'
```

### ESLint Configuration

This project uses **type-checked ESLint** with strict rules:

**Enabled rule sets:**

- `typescript-eslint/recommendedTypeChecked` - Type-aware linting
- `typescript-eslint/stylisticTypeChecked` - Consistent code style
- `eslint-config-next/core-web-vitals` - Next.js best practices
- `@convex-dev/eslint-plugin` - Convex-specific rules

**Custom enforced rules:**

| Rule                       | Effect                                        |
| -------------------------- | --------------------------------------------- |
| `consistent-type-imports`  | Enforces `import { type X }` syntax           |
| `no-unused-vars`           | Warns on unused variables (allows `_` prefix) |
| `no-restricted-properties` | Blocks `process.env` access                   |
| `no-restricted-imports`    | Blocks direct `convex/react` hooks            |

**To fix lint errors:**

```bash
# Check for errors
pnpm lint

# Many issues are auto-fixable
pnpm lint --fix
```

### Prettier Configuration

This project uses **Prettier** with these plugins:

| Plugin                                | Purpose                |
| ------------------------------------- | ---------------------- |
| `@ianvs/prettier-plugin-sort-imports` | Auto-sorts imports     |
| `prettier-plugin-tailwindcss`         | Sorts Tailwind classes |

**Import sort order** (automatically enforced):

1. React imports
2. External packages (alphabetical)
3. Internal `~/` imports (alphabetical)
4. Relative imports
5. Type-only imports last within each group

**To format code:**

```bash
# Check formatting without changes
pnpm format:check

# Format all files
pnpm format:write
```

### Error Resolution Workflow

When you encounter errors, follow this workflow:

```
┌─────────────────────────────────────────────────┐
│           Error encountered?                    │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   TypeScript?       ESLint?         Prettier?
        │               │               │
        ▼               ▼               ▼
   Fix the type      Fix or add       Run format:
   error manually    eslint-disable   write
        │            (with reason)      │
        │               │               │
        └───────────────┼───────────────┘
                        ▼
              Re-run validation checks
```

**ESLint disable comments** (use sparingly with justification):

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- External lib lacks types
const data = externalLib.getData();
```

### Pre-Commit Expectations

Before considering any task complete:

- [ ] `get_errors` returns no errors for modified files
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes (or only has pre-existing warnings)
- [ ] `pnpm format:write` has been run
- [ ] Code follows all project conventions from this document

---

## File Naming Conventions

| Type             | Convention          | Example                    |
| ---------------- | ------------------- | -------------------------- |
| Components       | kebab-case          | `chat-overview.tsx`        |
| Pages            | `page.tsx`          | `app/chats/page.tsx`       |
| Layouts          | `layout.tsx`        | `app/chats/layout.tsx`     |
| UI Components    | kebab-case in `ui/` | `components/ui/button.tsx` |
| Convex Functions | camelCase           | `convex/messages.ts`       |
| Types            | PascalCase          | `type UserData = ...`      |
| Utilities        | camelCase           | `lib/utils.ts`             |

---

## Common Patterns Quick Reference

### Server Component with Data Fetching

```tsx
// app/chats/page.tsx
export default async function ChatsPage() {
  return (
    <Suspense fallback={<ChatsSkeleton />}>
      <ChatsContent />
    </Suspense>
  );
}
```

### Client Component with Convex

```tsx
"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "../../convex/_generated/api";

export function ChatsContent() {
  const chats = useQuery(api.chats.getChats);
  if (!chats) return <Loading />;
  return <ChatsList chats={chats} />;
}
```

### Form with Validation

```tsx
"use client";

const schema = z.object({
  field: z.string().min(1).optional().or(z.literal("")),
});

export function MyForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Convex Mutation

```typescript
import { ConvexError, v } from "convex/values";
import { mutation } from "./lib/functions";

export const createItem = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    return ctx.table("items").insert({ name: args.name });
  },
});
```

---

## Remember

### Code Quality (MANDATORY after every change)

1. **ALWAYS** run `get_errors` on modified files to check for TypeScript/lint errors
2. **ALWAYS** run `pnpm typecheck` to verify type safety
3. **ALWAYS** run `pnpm lint` to catch code quality issues
4. **ALWAYS** run `pnpm format:write` to format code consistently
5. **NEVER** consider a task complete without validation passing

### Code Conventions

6. **ALWAYS** use `~/` path alias for imports
7. **ALWAYS** use `import { env } from "~/env"` for environment variables
8. **ALWAYS** use `useQuery` from `convex-helpers/react/cache/hooks`
9. **ALWAYS** use custom Convex wrappers from `convex/lib/functions.ts`
10. **ALWAYS** use `cn()` for className composition
11. **ALWAYS** use `.or(z.literal(""))` for optional form fields in Zod
12. **ALWAYS** use inline type imports: `import { type X }` not `import type { X }`
13. **ALWAYS** check for `undefined` when accessing arrays/objects (due to `noUncheckedIndexedAccess`)
14. **NEVER** use `forwardRef` - use React 19's ref prop instead
15. **NEVER** access `process.env` directly

### Documentation & Tools

16. **Use MCP tools** to look up documentation before implementing unfamiliar APIs
17. **Use browser automation** (not curl) to verify page changes
