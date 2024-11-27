/// <reference types="./eslint-types.d.ts" />

import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [".next/**", "convex/_generated/**", "public/sw.js"],
  },
  ...fixupConfigRules(
    compat.extends(
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended-type-checked",
      "plugin:@typescript-eslint/stylistic-type-checked",
      "plugin:react-hooks/recommended",
    ),
  ),
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
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
];
