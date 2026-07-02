import { test as base } from '@playwright/test';

// ═══════════════════════════════════════════════════════════
// Playwright fixture that captures browser console errors
// and uncaught page exceptions, failing the test on demand.
// ═══════════════════════════════════════════════════════════
//
// Usage:
//   import { test } from '@/e2e/console-fixture';
//   test('my test', async ({ page }) => { ... });
//
// To opt-out of console.error failures for a single test,
// add an annotation:
//   test('my test', async ({ page }) => {
//     test.info().annotations.push({ type: 'console', description: 'allow-errors' });
//     ...
//   });
// ═══════════════════════════════════════════════════════════

type ConsoleEntry = {
  readonly type: 'error' | 'warning' | 'log' | 'info' | 'debug';
  readonly text: string;
  readonly location: string;
};

const ALLOW_ERRORS_ANNOTATION = 'allow-errors';
const ALLOW_WARNINGS_ANNOTATION = 'allow-warnings';

const formatLocation = (loc: { readonly url?: string; readonly lineNumber?: number; readonly columnNumber?: number }): string =>
  `${loc.url ?? 'unknown'}:${loc.lineNumber ?? '?'}:${loc.columnNumber ?? '?'}`;

export const test = base.extend<{
  readonly consoleErrors: readonly ConsoleEntry[];
  readonly consoleWarnings: readonly ConsoleEntry[];
}>({
  consoleErrors: [
    async ({ page }, use, testInfo) => {
      const errors: ConsoleEntry[] = [];

      const onConsole = (msg: { readonly type: () => string; readonly text: () => string; readonly location: () => { readonly url?: string; readonly lineNumber?: number; readonly columnNumber?: number } }): void => {
        const msgType = msg.type();
        const text = msg.text();

        (msgType === 'error' ?
          errors.push({
            type: 'error',
            text,
            location: formatLocation(msg.location()),
          }) :
          undefined);
      };

      page.on('console', onConsole);

      const onPageError = (err: Error): void => {
        errors.push({
          type: 'error',
          text: `Uncaught: ${err.message}`,
          location: err.stack?.split('\n')[0] ?? 'unknown',
        });
      };

      page.on('pageerror', onPageError);

      await use(errors);

      page.off('console', onConsole);
      page.off('pageerror', onPageError);

      const annotationDescriptions = testInfo.annotations
        .filter(a => a.type === 'console')
        .map(a => a.description);

      const allowErrors = annotationDescriptions.includes(ALLOW_ERRORS_ANNOTATION);

      (errors.length > 0 && !allowErrors ?
        testInfo.errors.push({
          message: `Browser console errors detected:\n${errors.map(e => `  [${e.type}] ${e.text} (${e.location})`).join('\n')}`,
        }) :
        undefined);

      (errors.length > 0 ?
        testInfo.attachments.push({
          name: 'console-errors',
          contentType: 'text/plain',
          body: Buffer.from(errors.map(e => `[${e.type}] ${e.text} (${e.location})`).join('\n')),
        }) :
        undefined);
    },
    { scope: 'test' },
  ],

  consoleWarnings: [
    async ({ page }, use, testInfo) => {
      const warnings: ConsoleEntry[] = [];

      const onConsole = (msg: { readonly type: () => string; readonly text: () => string; readonly location: () => { readonly url?: string; readonly lineNumber?: number; readonly columnNumber?: number } }): void => {
        const msgType = msg.type();
        const text = msg.text();

        (msgType === 'warning' ?
          warnings.push({
            type: 'warning',
            text,
            location: formatLocation(msg.location()),
          }) :
          undefined);
      };

      page.on('console', onConsole);

      await use(warnings);

      page.off('console', onConsole);

      const annotationDescriptions = testInfo.annotations
        .filter(a => a.type === 'console')
        .map(a => a.description);

      const allowWarnings = annotationDescriptions.includes(ALLOW_WARNINGS_ANNOTATION);

      (warnings.length > 0 && !allowWarnings ?
        testInfo.errors.push({
          message: `Browser console warnings detected:\n${warnings.map(w => `  [warning] ${w.text} (${w.location})`).join('\n')}`,
        }) :
        undefined);

      (warnings.length > 0 ?
        testInfo.attachments.push({
          name: 'console-warnings',
          contentType: 'text/plain',
          body: Buffer.from(warnings.map(w => `[warning] ${w.text} (${w.location})`).join('\n')),
        }) :
        undefined);
    },
    { scope: 'test' },
  ],
});

export { expect } from '@playwright/test';

export const allowConsoleErrors = (): Readonly<{ type: 'console'; description: string }> => ({
  type: 'console',
  description: ALLOW_ERRORS_ANNOTATION,
});

export const allowConsoleWarnings = (): Readonly<{ type: 'console'; description: string }> => ({
  type: 'console',
  description: ALLOW_WARNINGS_ANNOTATION,
});