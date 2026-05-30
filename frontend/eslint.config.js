import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/', 'node_modules/'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'functional': functional,
      'import': importPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // ── Core ESLint ──
      'no-var': 'error',
      'prefer-const': 'error',
      'no-param-reassign': 'error',
      'no-shadow': 'off', // handled by @typescript-eslint
      '@typescript-eslint/no-shadow': 'error',

      // ── TypeScript ──
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ── Functional programming (FUNCTIONAL_TS.md) ──
      'functional/no-let': 'error',
      'functional/immutable-data': 'error',
      'functional/no-loop-statements': 'error',
      'functional/no-throw-statements': 'warn',

      // ── Imports ──
      'import/no-cycle': 'error',

      // ── React hooks ──
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];