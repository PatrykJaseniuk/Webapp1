# Functional TypeScript (TSX) — LLM Agent Rules
# ==============================================

# Apply these rules to every .tsx file you generate or modify.
# They layer React/JSX constraints on top of FUNCTIONAL_TS.md,
# whose §1–§12 remain in full effect unless explicitly overridden here.
# Where a conflict exists: FRONTEND_ARCH.md > this file > FUNCTIONAL_TS.md.
# Formatting is owned by Prettier — never hand-format JSX.

# ───────────────────────────────────────────────────────────────
# 1. COMPONENT DEFINITION
# ───────────────────────────────────────────────────────────────

- Components are `const`-assigned arrow functions returning `JSX.Element`.
  No `function` declarations, no classes, no `React.FC`.
- Props: a local `type Props = { readonly ... }` declared directly above the component.
  Every field `readonly`.
- Destructure props in the signature. Never access `props.` in the body.
- Named exports only — never `export default`.
- One component per file. File name = component name (PascalCase, plus the
  M/S/P suffix from FRONTEND_ARCH.md).

# ───────────────────────────────────────────────────────────────
# 2. STATE & IMMUTABILITY
# ───────────────────────────────────────────────────────────────

- `useState` is the sole mutation primitive. Always spread into new objects:
    ✅  setState(prev => ({ ...prev, field: value }));
    ❌  state.field = value;
- Server state NEVER lives in `useState` — it belongs to TanStack Query in
  master components (FRONTEND_ARCH.md §1). Slaves hold no state at all.
- `useRef` only for DOM node references, never for mutable data storage.
- Model component state machines with discriminated unions:
    type State =
      | { tag: "idle" }
      | { tag: "submitting" }
      | { tag: "ready"; data: T }
      | { tag: "error"; message: string };
- `useMemo` / `useCallback` only for genuinely expensive derivations or for
  stable references passed to memoized children — never as an escape hatch
  for mutability, never blanket-wrapped "just in case".

# ───────────────────────────────────────────────────────────────
# 3. JSX & CONTROL FLOW
# ───────────────────────────────────────────────────────────────

- Use ternary (`?`), `&&`, `||`, `??`, or `ts-pattern` for conditional JSX.
  Never `if/else` or `switch` in render logic.
- Complex branching (>2 branches) → extract a pure helper or use `ts-pattern`.
- Empty lists → use `match` or ternary for an empty-state message.
- List rendering: `.map()` only, never `.forEach()`.
  Key must be a stable unique identifier from the data, never array index.

# ───────────────────────────────────────────────────────────────
# 4. SIDE EFFECTS & EVENT HANDLERS
# ───────────────────────────────────────────────────────────────

- Event handlers are thin: extract data, call the prop callback.
  No business logic in the handler body.
- `e.preventDefault()` at the top of form handlers when needed.
- Form data extraction → pure module-level function:
    ✅  const extractInput = (fd: FormData): Input => ({ ... });
    ❌  inline extraction inside the handler.
- `useEffect` must clean up subscriptions/listeners with a returned function.
- Never call `async` functions directly inside `useEffect` — wrap in a named
  async helper and call it without `await`.
- Async work in handlers MUST be awaited or explicitly discarded with `void`
  (e.g. `void query.refetch();`) — enforced by `no-floating-promises`.

# ───────────────────────────────────────────────────────────────
# 5. TESTING
# ───────────────────────────────────────────────────────────────

| Test scope              | Suffix                       | Location                        |
|-------------------------|------------------------------|---------------------------------|
| Pure logic unit test    | `.unit.test.ts`              | Co-located with source          |
| Component unit/integ.   | `.unit.test.tsx` / `.integration.test.tsx` | Co-located with source  |
| Single-page e2e         | `.e2e.test.ts`               | Co-located with `pages/X.tsx`   |
| Multi-page e2e flow     | `.e2e.test.ts`               | `frontend/e2e/`                 |
| Slave component stories | `.stories.tsx`               | Co-located with slave component |

- Test behaviour (rendered output, user flows), never internals.
- Query by accessible role / label / text — never by CSS class or test-id.
- Slave components (pure render, no side effects) are ideal Storybook candidates
  for visual regression and component catalogue purposes.
- This section overrides FUNCTIONAL_TS.md §10 on naming and location.

# ───────────────────────────────────────────────────────────────
# 6. ACCESSIBILITY
# ───────────────────────────────────────────────────────────────

- Semantic HTML first: `<button>`, `<a>`, `<nav>`, `<main>`, `<table>`,
  `<h1>–<h6>` — never clickable `<div>`s.
- Every form control MUST have an associated `<label htmlFor>` (or
  `aria-label` when a visible label is impossible by design).
- Validation errors: set `aria-invalid` on the control and link the error
  text with `aria-describedby`.
- Status/feedback MUST be perceivable without colour (icon or text alongside
  coloured pills).
- Interactive elements MUST be keyboard-reachable and operable.
- Stories run the Storybook a11y addon — keep it green.


# ───────────────────────────────────────────────────────────────
# 8. ANTI-PATTERNS — NEVER DO THESE
# ───────────────────────────────────────────────────────────────

- ❌  `export default` — named exports only.
- ❌  `React.FC` — use explicit `JSX.Element` return type.
- ❌  `dangerouslySetInnerHTML` — absent an explicit, commented justification.
- ❌  Array index as `key` prop.
- ❌  `useRef` for mutable data (only for DOM refs).
- ❌  `useState` for server state — TanStack Query in masters owns it.
- ❌  `if/else` or `switch` in render logic.
- ❌  Raw `useContext` in a component — wrap in a typed custom hook.
- ❌  Mutate state in place — always spread.
- ❌  `throw` in a component body or event handler.
- ❌  `useEffect` without cleanup for subscriptions/listeners.
- ❌  `useEffect` for data fetching — `useQuery` in masters (FRONTEND_ARCH.md §1).
- ❌  Inline complex conditional JSX — extract a helper or use `ts-pattern`.
- ❌  Business logic or data fetching in presentational components.
- ❌  Floating promises in handlers — `await` or `void` every promise.
- ❌  Clickable `<div>` or colour-only status indicators (see §6).
- ❌  Inline `style` for static styling — Tailwind classes (see §7).

# ───────────────────────────────────────────────────────────────
# END OF RULES
# ───────────────────────────────────────────────────────────────