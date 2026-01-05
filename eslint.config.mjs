// @ts-check
import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Use type-checked configs for stricter TypeScript linting
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // Override default ignores of eslint-config-next
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific ignores:
    "convex/_generated/**",
    "public/sw.js",
  ]),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript-eslint rules
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      /**
       * All packages that leverage t3-env should use this rule
       */
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Use `import { env } from '~/env'` instead to ensure validated types.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          name: "process",
          importNames: ["env"],
          message:
            "Use `import { env } from '~/env'` instead to ensure validated types.",
        },
        {
          name: "convex/react",
          importNames: ["useQueries", "useQuery"],
          message:
            "Use `import { useQuery, useQueries } from 'convex-helpers/react/cache/hooks'` instead to have a full in-memory cache.",
        },
      ],
    },
  },
  {
    files: [
      "convex/**",
      "src/env.ts",
      "next.config.js",
      "src/instrumentation.ts",
    ],
    rules: {
      "no-restricted-properties": "off",
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
