# Functional TypeScript — LLM Agent Rules
# =========================================
# Apply these rules to every TypeScript file you generate or modify.
# They encode a strict functional-programming style for TS projects.

# ───────────────────────────────────────────────────────────────
# 1. CORE PHILOSOPHY
# ───────────────────────────────────────────────────────────────

- Write pure functions by default. A function must have no observable side effects
  unless it is explicitly labelled as effectful (see §8).
- Prefer expressions over statements. Favour ternaries, `&&`, `||`, and `??`
  over `if/else` blocks where the intent remains clear.
- Data is immutable. Never mutate an object or array after creation.
- Compose small, single-purpose functions into larger behaviour.
- Avoid classes. Model everything with plain data types and standalone functions.

# ───────────────────────────────────────────────────────────────
# 2. IMMUTABILITY
# ───────────────────────────────────────────────────────────────

- Never use `let` or `var`. Declare every variable with `const`.
- Type all object literals as `Readonly<T>` or use `as const` where appropriate.
- Use `ReadonlyArray<T>` (or `readonly T[]`) instead of `T[]` for parameters
  and return types.
- Spread or use structuredClone / immer for updates; never mutate in place:
    ✅  const updated = { ...user, name: "Alice" };
    ❌  user.name = "Alice";
- Freeze top-level config objects: `Object.freeze({ ... })`.

# ───────────────────────────────────────────────────────────────
# 3. TYPE SYSTEM
# ───────────────────────────────────────────────────────────────

- Enable and respect strict mode: `"strict": true` in tsconfig.
- Prefer `type` aliases over `interface` for data shapes; use `interface` only
  when declaration merging is required.
- Use `import type` for type-only imports
  (`@typescript-eslint/consistent-type-imports` should be enabled).
- Model absence with `Option<T>` (None | Some<T>), not `T | null | undefined`.
  Use `fp-ts` or a local definition — never return `null` from pure functions.
  Exception: React hooks (`useState`, `useParams`) and framework APIs that
  return `undefined` are exempt from `Option` wrapping at the boundary.
- Model errors with `Result<T, E>` (Ok<T> | Err<E>), not thrown exceptions.
- Use discriminated unions to encode state machines:
    type State =
      | { tag: "idle" }
      | { tag: "loading" }
      | { tag: "success"; data: Data }
      | { tag: "error"; error: AppError };
- Avoid `any`. Use `unknown` when the type is genuinely unknown, then narrow it.
- Avoid non-null assertions (`!`). Prove safety through types or exhaustive checks.
- Use `satisfies` to validate literals against a type without widening.
- Use template-literal types and branded types to prevent primitive obsession:
    type UserId = string & { readonly _brand: "UserId" };

# ───────────────────────────────────────────────────────────────
# 4. FUNCTION DESIGN
# ───────────────────────────────────────────────────────────────

- Every function has exactly one `return` statement. Early returns and guard
  clauses (`if (!x) return;`) are forbidden. Use ternary expressions, `&&`,
  `||`, `??`, lookup objects, `pipe`/`flow`, or `ts-pattern` instead.
- Functions are first-class values. Assign them to constants, pass them around,
  and return them from other functions.
- Keep functions small: one level of abstraction, ≤ 20 lines as a guideline.
- Use named parameters (object destructuring) for functions with > 2 arguments:
    const createUser = ({ name, email, role }: CreateUserInput): User => ...
- Curry or partially apply when it improves composability:
    const add = (a: number) => (b: number): number => a + b;
- Prefer pipeline-style composition with `pipe` / `flow` (fp-ts or a local util):
    const serialize = (input: RawInput): Output =>
      pipe(
        input,
        validate,
        transform,
        format,
      );
- Avoid default exports. Named exports keep the contract explicit.

# ───────────────────────────────────────────────────────────────
# 5. ARRAY & COLLECTION OPERATIONS
# ───────────────────────────────────────────────────────────────

- Use declarative array methods instead of imperative loops:
    ✅  items.filter(...).map(...).reduce(...)
    ❌  for (let i = 0; i < items.length; i++) { ... }
- For complex pipelines use `fp-ts/Array` or `remeda` to keep types tight.
- Never call `.forEach` for transformations; use `.map` or `.reduce`.
  `.forEach` is only acceptable for isolated side-effectful calls (logging, I/O).
- Prefer `Array.from` or spread over `new Array(n).fill(...)` for generation.

# ───────────────────────────────────────────────────────────────
# 6. PATTERN MATCHING & CONTROL FLOW
# ───────────────────────────────────────────────────────────────

- Do not use `switch` statements. Use `ts-pattern`'s `match(...).with(...).exhaustive()`
  for exhaustive discriminated union matching.
- For simple value-to-value mappings, use lookup objects instead of
  `if/else if` chains:
    ✅  const label = STATUS_LABEL[status] ?? status;
    ❌  if (status === 'a') return 'X'; else if (status === 'b') return 'Y';
- Avoid nested ternaries beyond two levels; extract named functions instead.
- `if` as a statement is permitted only for side-effect branching in React
  handlers and event callbacks where all paths converge to a single exit.
  Guard clauses with early return are forbidden (see §4).
- Exhaust every discriminated union. `ts-pattern`'s `.exhaustive()` provides
  compile-time checking — never use a throw-based `assertNever`.
- Ternary `?` and `:` must be placed at the **end of the line**, not at the
  beginning of the next line:
    ✅  const result =
          condition ?
            consequent :
            alternative;
    ❌  const result =
          condition
            ? consequent
            : alternative;

# ───────────────────────────────────────────────────────────────
# 7. ERROR HANDLING
# ───────────────────────────────────────────────────────────────

- `throw` is completely prohibited. There are zero exceptions.
- All error paths flow through `Result<T, E>` (Ok<T> | Err<E>).
- Define `Result<T, E>` and `ok`/`err` constructors in `domain/types.ts`:
    export type Result<T, E> =
      | { readonly tag: 'ok';  readonly value: T }
      | { readonly tag: 'err'; readonly error: E };

    export const ok = <T, E>(value: T): Result<T, E> =>
      ({ tag: 'ok', value });
    export const err = <T, E>(error: E): Result<T, E> =>
      ({ tag: 'err', error });
- Provide a typed `AppError` discriminated union covering every domain error
  variant (NetworkError, NotFound, ValidationError, etc.).
- Never swallow errors silently (`catch (_) {}`). Always wrap into `Result`.
- Map external throwing APIs to Result at the boundary:
    const safeJsonParse = (s: string): Result<unknown, SyntaxError> => {
      try { return ok(JSON.parse(s)); }
      catch (e) { return err(e as SyntaxError); }
    };

# ───────────────────────────────────────────────────────────────
# 8. SIDE EFFECTS & I/O
# ───────────────────────────────────────────────────────────────

- Isolate I/O at the edges (dependency injection, adapter pattern, or `IO<A>`).
- Name effectful functions with a verb that implies the effect:
    fetchUser, saveOrder, logEvent — not getUser (which implies purity).
- Use `async/await` for asynchronous effects. All async I/O functions in
  `infra/` return `Promise<Result<T, AppError>>` — never `Promise<T>` that
  may reject.
- Keep async functions as thin orchestrators; delegate pure logic to sync helpers.
- Never use `Promise.all` with side-effectful mutations unless order is irrelevant
  and partial failure is handled.

# ───────────────────────────────────────────────────────────────
# 9. NAMING CONVENTIONS
# ───────────────────────────────────────────────────────────────

- Types / Interfaces: PascalCase  →  `UserProfile`, `Result<T, E>`
- Functions & constants: camelCase  →  `parseDate`, `MAX_RETRIES`
- Type parameters: single upper-case or descriptive upper-case →  `T`, `TError`
- Predicates: prefix with `is` / `has` →  `isAdmin`, `hasPermission`
- Constructors / smart constructors: prefix with `make` or `create`
  →  `makeUser`, `createOrder`
- Branded type tags: `_brand` (private, never accessed at runtime)

# ───────────────────────────────────────────────────────────────
# 10. TESTING
# ───────────────────────────────────────────────────────────────

- Pure functions must have unit tests with no mocking.
- Test behaviour (inputs → outputs), not implementation.
- Use property-based testing (fast-check) for data-transformation functions.
- Effectful adapters are integration/E2E tested at the boundary; pure core is not.
- Co-locate tests: `user.ts` → `user.test.ts` in the same directory.

# ───────────────────────────────────────────────────────────────
# 11. TOOLING & LINTING
# ───────────────────────────────────────────────────────────────

- ESLint rules to enforce (add to `.eslintrc`):
    "no-var": "error"
    "prefer-const": "error"
    "no-param-reassign": "error"
    "no-shadow": "error"
    "@typescript-eslint/no-explicit-any": "error"
    "@typescript-eslint/no-non-null-assertion": "error"
    "@typescript-eslint/consistent-type-imports": "error"
    "functional/no-let": "error"               # eslint-plugin-functional
    "functional/immutable-data": "error"
    "functional/no-loop-statements": "error"
    "functional/no-throw-statements": "error"
    "import/no-cycle": "error"

- Recommended libraries (peer-reviewed, tree-shakable):
    fp-ts           — Option, Either/Result, pipe, flow, Task
    ts-pattern      — exhaustive pattern matching
    io-ts           — runtime type validation aligned with fp-ts
    remeda          — FP-flavoured lodash with full TS inference
    zod             — schema validation with inferred types
    fast-check      — property-based testing

# ───────────────────────────────────────────────────────────────
# 12. ANTI-PATTERNS — NEVER DO THESE
# ───────────────────────────────────────────────────────────────

- ❌  Use `throw` anywhere (no exceptions — see §7).
- ❌  Use `switch` statements (use `ts-pattern` — see §6).
- ❌  Have multiple `return` statements in a function (see §4).
- ❌  Use guard clauses with early return (`if (!x) return;`).
- ❌  Mutate function arguments or external state inside a "pure" function.
- ❌  Use `class` for domain modelling (use plain objects + functions).
- ❌  Rely on `this` outside of framework-required contexts.
- ❌  Use `enum` — prefer `as const` objects or union literals instead.
- ❌  Write callbacks that capture and mutate outer variables.
- ❌  Use `Object.assign` to mutate the first argument; always spread into a new {}.
- ❌  Use `any` to escape the type system; use `unknown` + narrowing.
- ❌  Leave a `Promise` floating (unhandled) — always `await` or return it.
- ❌  Mix business logic with I/O in the same function.
- ❌  Use `if/else if` chains for value mapping — use lookup objects or `ts-pattern`.

# ───────────────────────────────────────────────────────────────
# END OF RULES
# ───────────────────────────────────────────────────────────────