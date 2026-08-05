// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

const tsconfigRootDir = new URL('.', import.meta.url).pathname;

// ── Architecture boundary zones — mirrors .clinerules/FRONTEND_ARCH.md ──

// Slave import whitelist — only two architectural dirs:
//   ✅ @/masterComponents, ../masterComponents  (SProps + form-input types)
//   ✅ @/slaveComponents, ./                    (sibling pure-render helpers)
//   ❌ Everything else                          (slave tests/stories are excluded)
const slaveAllowedPatterns = [/^ts-pattern$/, /^@\/masterComponents\//, /^\.\.\/masterComponents\//, /^@\/slaveComponents\//, /^\.\//];

const matchesWhitelist = (source) =>
  slaveAllowedPatterns.some((p) => p.test(source));

const slaveImportRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Slaves may only import from masterComponents and slaveComponents.' },
    messages: {
      forbidden: 'Slave import "{{ source }}" is not allowed. Slaves may only import from @/masterComponents and @/slaveComponents (or relative equivalents). ' +
        'Everything else must arrive via props (FRONTEND_ARCH.md §2).',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const isTypeOnly = node.importKind === 'type' || node.specifiers.every((s) => s.importKind === 'type');
        const source = /** @type {string} */ (node.source.value);
        !isTypeOnly && !matchesWhitelist(source) ?
          context.report({ node, messageId: 'forbidden', data: { source } }) :
          undefined;
      },
      ImportExpression(node) {
        const source = /** @type {string} */ (node.source.value);
        !matchesWhitelist(source) ?
          context.report({ node, messageId: 'forbidden', data: { source } }) :
          undefined;
      },
    };
  },
};

const TEST_AND_STORY_FILES = [
  '**/*.unit.test.ts', '**/*.unit.test.tsx',
  '**/*.integration.test.ts', '**/*.integration.test.tsx',
  '**/*.e2e.test.ts',
  '**/*.stories.tsx',
  '**/test-setup.ts',
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
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],

      // ── Functional programming (FUNCTIONAL_TS.md) ──
      'functional/no-let': 'error',
      'functional/functional-parameters': ['error', { enforceParameterCount: false, allowRestParameter: false, allowArgumentsKeyword: false }],
      'functional/immutable-data': 'error',
      'functional/no-loop-statements': 'error',
      'functional/prefer-readonly-type': 'error',
      'functional/no-classes': 'error',
      'functional/no-throw-statements': 'error',

      // ── Control-flow bans (FUNCTIONAL_TS.md §1, §4, §6) ──
      'no-restricted-syntax': ['error',
        { selector: 'IfStatement', message: '`if` is NEVER allowed — use ternaries for branching (FUNCTIONAL_TS.md §1).' },
        { selector: 'SwitchStatement', message: '`switch` is banned — use `match().with().exhaustive()` (FUNCTIONAL_TS.md §4).' },
        { selector: 'TSEnumDeclaration', message: '`enum` is banned — use `as const` objects (FUNCTIONAL_TS.md §6).' },
      ],

      // ── Named exports only (FUNCTIONAL_TS.md §3, §6) ──
      'import/no-default-export': 'error',

      // ── Imports ──
      'import/no-cycle': 'error',

      // ── React hooks ──
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ── Architecture boundary zones (FRONTEND_ARCH.md) ──
  {
    // Slave components: whitelist — only masterComponents, slaveComponents, and npm packages
    files: ['src/slaveComponents/**/*.tsx'],
    ignores: TEST_AND_STORY_FILES,
    plugins: { 'slave-boundary': { rules: { 'allowed-imports': slaveImportRule } } },
    rules: { 'slave-boundary/allowed-imports': 'error' },
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

  // ── Config files: same strict rules, but allow default export (ESLint 9 convention) ──
  {
    files: ['*.config.{js,mjs}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        projectService: { allowDefaultProject: ['*.config.{js,mjs}'] },
        tsconfigRootDir,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'functional': functional,
      'import': importPlugin,
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-param-reassign': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'functional/no-let': 'error',
      'functional/immutable-data': 'error',
      'functional/no-loop-statements': 'error',
      'functional/no-classes': 'error',
      'functional/no-throw-statements': 'error',
      'no-restricted-syntax': ['error',
        { selector: 'IfStatement', message: '`if` is NEVER allowed — use ternaries for branching (FUNCTIONAL_TS.md §1).' },
        { selector: 'SwitchStatement', message: '`switch` is banned — use `match().with().exhaustive()` (FUNCTIONAL_TS.md §4).' },
        { selector: 'TSEnumDeclaration', message: '`enum` is banned — use `as const` objects (FUNCTIONAL_TS.md §6).' },
      ],
      'import/no-default-export': 'off',
      'import/no-cycle': 'error',
    },
  },

  // ── Tests & stories: relaxed (mock data, play functions, throwaway async) ──
  {
    files: TEST_AND_STORY_FILES,
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Rest parameters are idiomatic in test utilities (e.g. `render(ui, ...options)`)
      'functional/functional-parameters': 'off',
      // let + mutation are required by Vitest's describe/beforeAll (mutable setup state)
      'functional/no-let': 'off',
      'functional/immutable-data': 'off',
      // throw is standard for signalling test-setup failures
      'functional/no-throw-statements': 'off',
      // if/switch are standard in test helpers for conditional setup
      'no-restricted-syntax': 'off',
      // Storybook CSF requires `export default meta` (framework API, not a style choice)
      'import/no-default-export': 'off',
    },
  },

  ...storybook.configs["flat/recommended"],
];