# Functional TypeScript — LLM Agent Rules
# =========================================

# Apply these rules to every TypeScript file you generate or modify.
# PRECEDENCE: project-specific rules > framework-specific rules > this file.

# ───────────────────────────────────────────────────────────────
# 1. CORE
# ───────────────────────────────────────────────────────────────

- Pure functions by default. No observable side effects unless explicitly labelled effectful.
- Expressions over statements. Ternaries, `&&`, `||`, `??` over `if/else`.
- Data is immutable. Never mutate objects or arrays after creation.
- Compose small, single-purpose functions into larger behaviour.
- No classes. Plain data types and standalone functions.

# ───────────────────────────────────────────────────────────────
# 2. TYPES
# ───────────────────────────────────────────────────────────────

- `"strict": true` in tsconfig.
- `type` over `interface` (use `interface` only for declaration merging).
- `import type` for type-only imports.
- Absence at boundaries is `| null`. Pure functions never return `undefined`.
- No `any`. Narrow `unknown` instead. No `!` non-null assertions.
- Discriminated unions for state machines: `{ tag: "idle" } | { tag: "ready"; data: T } | ...`
- Branded types for primitives: `type UserId = string & { readonly _brand: "UserId" }`.

# ───────────────────────────────────────────────────────────────
# 3. FUNCTIONS
# ───────────────────────────────────────────────────────────────

- Exactly one `return` per function. No early returns, no guard clauses.
- `throw` is forbidden — it violates single-return (use `Result<T,E>` for errors).
- Destructured params for > 2 arguments; `const`-assigned; named exports only.
- Prefer pipeline composition (`pipe` / `flow`).

# ───────────────────────────────────────────────────────────────
# 4. CONTROL FLOW
# ───────────────────────────────────────────────────────────────

- No `switch`. Exhaust discriminated unions via `match`:
    `match(value).with({ tag: "..." }, ...).with({ tag: "..." }, ...).exhaustive()` — every tag handled.
- Lookup objects for value mappings, never `if/else if` chains.
- Declarative array methods: `.map`, `.filter`, `.reduce`. No loops.

# ───────────────────────────────────────────────────────────────
# 5. ERRORS & EFFECTS
# ───────────────────────────────────────────────────────────────

- `throw` is NEVER allowed. Model all errors with `Result<T, E>`:
    type Result<T, E> =
      | { readonly tag: 'ok';  readonly value: T }
      | { readonly tag: 'err'; readonly error: E };
- Async functions: return error states, never throw. Never swallow errors.
- I/O isolated at the edges. Dedicated data-access layer, thin async orchestrators.
- Every promise: `await`, `return`, or `void`. No floating promises.
- Name effectful functions with effect-implying verbs: `fetchUser`, `saveOrder`.

# ───────────────────────────────────────────────────────────────
# 6. ANTI-PATTERNS
# ───────────────────────────────────────────────────────────────

- ❌ `throw` anywhere
- ❌ Multiple `return` / early return / guard clauses
- ❌ `switch`, `if/else if` chains, imperative loops
- ❌ `let`, `var`, mutation in place, mutating callbacks
- ❌ `enum` — use `as const` objects
- ❌ `any`, `!`, floating promises, swallowed errors
- ❌ `class`, `this` (outside framework-required contexts)
- ❌ `export default`
- ❌ Business logic mixed with I/O
- ❌ Hand-formatting — formatter owns layout