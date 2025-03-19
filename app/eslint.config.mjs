import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt([
  {
    ignores: [
      "dist/",
      ".output/",
      "node_modules/",
      ".nuxt/",
    ],
  },
  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "semi": ["error", "always"],
      "vue/html-indent": ["error", 2],
      "comma-dangle": ["error", "always-multiline"],
      "@typescript-eslint/no-unused-vars": ["warn"],
      "vue/multi-word-component-names": "off",
      "import/no-duplicates": "off",
      "quotes": ["error", "single"],
      "indent": ["error", 2],
      "vue/max-attributes-per-line": [
        "error",
        {
          singleline: 3,
          multiline: 1,
        },
      ],
      "vue/script-indent": [
        "error", 2, {
          baseIndent: 1,
          switchCase: 1,
          ignores: [],
        },
      ],
    },
  },
  {
    files: ["**/*.vue"],
    rules: {
      "indent": "off",
      "vue/html-indent": ["error", 2],
      "vue/script-indent": [
        "error", 2, {
          baseIndent: 1,
          switchCase: 1,
          ignores: [],
        },
      ],
      "vue/block-order": ["error", {
        "order": [["script", "template"], "style"]
      }]
    },
  },
]);