// ── Shared utilities ──
// Generic FP helpers, UI primitives — no domain knowledge.

/** Forces exhaustiveness check on discriminated unions. */
export const assertNever = (x: never): never => {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
};