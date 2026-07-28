// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

const tsconfigRootDir = new URL('.', import.meta.url).pathname;

// Architecture boundary zones — mirrors .clinerules/FRONTEND_ARCH.md.
// Slaves = pure render; masters = containers; pages = wiring; generic = zero-domain.
// NOTE: slaves MUST import their master's SProps type (exactly one, plus the
// form-input type for form slaves). ESLint cannot count type-only imports, so
// masterComponents is intentionally absent here — that constraint stays
// prose-enforced in FRONTEND_ARCH.md §2.
const SLAVE_FORBIDDEN = [
  '@/backendConnector', '@/backendConnector/*',
  '@/pages', '@/pages/*',
  '@/hooks', '@/hooks/*',
  '@/generic', '@/generic/*',
  '@/main', '@/main/*',
  '../backendConnector', '../backendConnector/*',
  '../pages', '../pages/*',
  '../hooks', '../hooks/*',
  '../generic', '../generic/*',
  '../main', '../main/*',
  '@tanstack/react-router', '@tanstack/react-router/*',
  '@tanstack/react-query',
];

const TEST_AND_STORY_FILES = [
  '**/*.unit.test.ts', '**/*.unit.test.tsx',
  '**/*.integration.test.tsx', '**/*.e2e.test.ts',
  '**/*.stories.tsx',
];

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/', 'node_modules/', 'src/backendConnector/__generated__/'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir,
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
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],

      // ── Functional programming (FUNCTIONAL_TS.md) ──
      'functional/no-let': 'error',
      'functional/immutable-data': 'error',
      'functional/no-loop-statements': 'error',
      // `throw` allowed only inside async functions (queryFn/mutationFn) —
      // there it rejects the promise, TanStack Query's error channel (FUNCTIONAL_TS.md §7).
      'functional/no-throw-statements': ['error', { allowToRejectPromises: true }],

      // ── Imports ──
      'import/no-cycle': 'error',

      // ── React hooks ──
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ── Architecture boundary zones (FRONTEND_ARCH.md) ──
  {
    files: ['src/slaveComponents/**/*.tsx'],
    ignores: TEST_AND_STORY_FILES,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: SLAVE_FORBIDDEN,
          message: 'Slaves are pure render — everything arrives via props (FRONTEND_ARCH.md §2).',
        }],
      }],
    },
  },
  {
    // Stories/tests of slaves render with mocked props — still no data layer.
    files: ['src/slaveComponents/**/*.stories.tsx', 'src/slaveComponents/**/*.unit.test.*', 'src/slaveComponents/**/*.integration.test.*'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/backendConnector', '@/backendConnector/*', '../backendConnector', '../backendConnector/*'],
          message: 'Slave stories/tests mock props — no data layer (FRONTEND_ARCH.md §2).',
        }],
      }],
    },
  },
  {
    files: ['src/masterComponents/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/slaveComponents', '@/slaveComponents/*', '../slaveComponents', '../slaveComponents/*',
            '@/pages', '@/pages/*', '../pages', '../pages/*',
          ],
          message: 'Masters receive their slave via the `Slave` prop and never import pages (FRONTEND_ARCH.md §1).',
        }],
      }],
    },
  },
  {
    files: ['src/pages/**/*.tsx'],
    ignores: TEST_AND_STORY_FILES,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/backendConnector', '@/backendConnector/*', '../backendConnector', '../backendConnector/*'],
          message: 'Pages wire auth + params to masters; data access belongs in masters (FRONTEND_ARCH.md §3).',
        }],
      }],
    },
  },
  {
    files: ['src/generic/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/backendConnector/*', '@/masterComponents/*', '@/slaveComponents/*',
            '@/pages/*', '@/hooks/*', '@/main/*',
            '../backendConnector/*', '../masterComponents/*', '../slaveComponents/*',
            '../pages/*', '../hooks/*', '../main/*',
          ],
          message: 'generic/ is zero-domain-knowledge and must not import application layers (FRONTEND_ARCH.md §0).',
        }],
      }],
    },
  },
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    ignores: TEST_AND_STORY_FILES,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/masterComponents', '@/masterComponents/*', '../masterComponents/*',
            '@/slaveComponents', '@/slaveComponents/*', '../slaveComponents/*',
            '@/pages', '@/pages/*', '../pages/*',
            '@/main', '@/main/*', '../main/*',
          ],
          message: 'hooks/ provides context to the app; it must not depend on component layers.',
        }],
      }],
    },
  },

  // ── Tests & stories: relaxed (mock data, play functions, throwaway async) ──
  {
    files: TEST_AND_STORY_FILES,
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'functional/no-throw-statements': 'off',
      'functional/no-loop-statements': 'off',
    },
  },

  ...storybook.configs["flat/recommended"],
];