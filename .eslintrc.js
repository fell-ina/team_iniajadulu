module.exports = {
  extends: [
    "next/core-web-vitals",
    "next/typescript",
  ],
  rules: {
    "react-hooks/set-state-in-effect": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};