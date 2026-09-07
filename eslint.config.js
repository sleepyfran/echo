import eslint from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import lit from "eslint-plugin-lit";
import webComponents from "eslint-plugin-wc";
import globals from "globals";

export default [
  {
    ignores: ["**/dist/**"],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs["flat/recommended"],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  webComponents.configs["flat/recommended"],
  lit.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    settings: {
      "import/extensions": [".ts", ".tsx"],
      "import/resolver": {
        typescript: true,
        node: false,
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "import/default": "off",
      "import/no-named-as-default": "off",
      "import/no-extraneous-dependencies": "error",
      "import/no-cycle": "error",
    },
  },
];
