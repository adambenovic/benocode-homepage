// @ts-check
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  // Next.js core web vitals rules (includes React, JSX, Next.js-specific rules)
  ...coreWebVitals,

  // TypeScript-specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // warn rather than error: codebase uses `any` in many places (ongoing cleanup)
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      // React Compiler rules (included via react-hooks plugin in Next.js 16):
      // set to warn — these flag pre-existing patterns that work correctly at runtime
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },

  // Prettier: disable formatting rules that conflict with prettier
  {
    rules: prettier.rules,
  },

  // Ignore build output and test mocks
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**'],
  },
];
