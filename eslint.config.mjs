import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disable formatting rules for Practice Modes (custom glassmorphism styling)
  {
    files: [
      "src/components/dashboard/practice-modes-section.tsx",
      "src/app/practice-modes/page.tsx",
      "src/components/learning/practice-modes/**/*.tsx"
    ],
    rules: {
      // Disable JSX formatting rules to preserve custom inline styles
      "react/jsx-max-props-per-line": "off",
      "react/jsx-first-prop-new-line": "off",
      "react/jsx-indent": "off",
      "react/jsx-indent-props": "off",
      "@typescript-eslint/indent": "off",
    }
  }
]);

export default eslintConfig;
