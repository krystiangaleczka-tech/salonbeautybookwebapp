module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "eslint-config-google",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
        tsconfigRootDir: __dirname,
        sourceType: "module",
    },
    ignorePatterns: [
        "/lib/**/*",
        "/generated/**/*",
        "**/*.js",
    ],
    plugins: [
        "@typescript-eslint",
        "import",
    ],
    rules: {
        "quotes": ["error", "double"],
        "import/no-unresolved": 0,
        "indent": ["error", 4],
        "max-len": ["error", { "code": 120 }],
        "object-curly-spacing": ["error", "always"],
        "comma-dangle": ["error", "always-multiline"],
        "eol-last": ["error", "always"],
        "no-trailing-spaces": ["error", { "skipBlankLines": true }],
        "no-multiple-empty-lines": ["error", { "max": 2 }],
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "valid-jsdoc": "off",
    },
};
