import { defineConfig } from "react-doctor/api";
import type { ReactDoctorConfig } from "react-doctor/api";

export const sharedDoctorConfig = {
  scope: "full",
  // Lint (`bun lint` / oxlint) owns type-aware + project oxlint rules.
  // Doctor only runs its curated react-doctor surface — no duplicate work.
  adoptExistingLintConfig: false,
  rules: {
    "react-doctor/no-multi-comp": "off",
    "react-doctor/react-compiler-no-manual-memoization": "off",
    "react-doctor/no-giant-component": "off",
    "react-doctor/no-high-complexity-react-function": "off",
    "react-doctor/duplicate-jsx-subtree": "off",
  },
} as const satisfies ReactDoctorConfig;

export default defineConfig(sharedDoctorConfig);
