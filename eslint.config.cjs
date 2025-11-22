const js = require("@eslint/js");
const parser = require("@typescript-eslint/parser");
const tseslint = require("@typescript-eslint/eslint-plugin");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    languageOptions: {
      parser,
      parserOptions: { sourceType: "module" },
      globals: {
        crypto: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        document: "readonly",
        CryptoKey: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];