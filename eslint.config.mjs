// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

import tsParser from "@typescript-eslint/parser";
import jsdoc from "eslint-plugin-jsdoc";
import storybook from "eslint-plugin-storybook";
import { booleanIsPrefix } from "./eslint-rules/boolean-is-prefix.mjs";
import { eventHandlerOnPrefix } from "./eslint-rules/event-handler-on-prefix.mjs";
import { useEffectDelegateOnly } from "./eslint-rules/use-effect-delegate-only.mjs";

export default [
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/*.stories.{ts,tsx}",
      "src/components/ui/**",
    ],
    plugins: {
      jsdoc,
      local: {
        rules: {
          "event-handler-on-prefix": eventHandlerOnPrefix,
          "boolean-is-prefix": booleanIsPrefix,
          "use-effect-delegate-only": useEffectDelegateOnly,
        },
      },
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      curly: ["error", "all"],
      complexity: ["error", 10],
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: ["FunctionDeclaration", "MethodDefinition"],
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-param-type": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-type": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-types": "error",
      "jsdoc/require-description": "error",
      "local/event-handler-on-prefix": "error",
      "local/boolean-is-prefix": "error",
      "local/use-effect-delegate-only": "error",
    },
  },
  ...storybook.configs["flat/recommended"],
  {
    // The storybook flat config lints stories but sets no parser; give it the
    // TypeScript/JSX parser so .stories.tsx files parse.
    files: ["**/*.stories.@(ts|tsx)"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];
