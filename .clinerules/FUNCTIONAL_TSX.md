# Functional TypeScript (TSX) — LLM Agent Rules
# ==============================================

# Apply these rules to every .tsx file you generate or modify.
# They layer React/JSX constraints on top of FUNCTIONAL_TS.md,
# whose §1–§12 remain in full effect unless explicitly overridden here.

# ───────────────────────────────────────────────────────────────
# 1. COMPONENT DEFINITION
# ───────────────────────────────────────────────────────────────

- Components are `const`-assigned arrow functions returning `JSX.Element`.
  No `function` declarations, no classes, no `React.FC`.
- Props: a local `type Props = { readonly ... }` declared directly above the component.
  Every field `readonly`.
- Destructure props in the signature. Never access `props.` in the body.
- Named exports only — never `export default`.
- One component per file. File name = component name (PascalCase).

# ───────────────────────────────────────────────────────────────
# 2. STATE & IMMUTABILITY
# ───────────────────────────────────────────────────────────────

- `useState` is the sole mutation primitive. Always spread into new objects:
    ✅  setState(prev => ({ ...prev, field: value }));
    ❌  state.field = value;
- `useRef` only for DOM node references, never for mutable data storage.
- Model component state machines with discriminated unions:
    type State =
      | { tag: "idle" }
      | { tag: "loading" }
      | { tag: "ready"; data: T }
      | { tag: "error"; message: string };
- `useMemo` / `useCallback` for derived data and stable callbacks — never as
  an escape hatch for mutability.

# ───────────────────────────────────────────────────────────────
# 3. JSX & CONTROL FLOW
# ───────────────────────────────────────────────────────────────

- Use ternary (`?`), `&&`, `||`, `??`, or `ts-pattern` for conditional JSX.
  Never `if/else` or `switch` in render logic.
- `?` and `:` placed at the **end** of the line:
    ✅  {condition ?
          <A /> :
          <B />}
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

# ───────────────────────────────────────────────────────────────
# 6. ANTI-PATTERNS — NEVER DO THESE
# ───────────────────────────────────────────────────────────────

- ❌  `export default` — named exports only.
- ❌  `React.FC` — use explicit `JSX.Element` return type.
- ❌  `dangerouslySetInnerHTML` — absent an explicit, commented justification.
- ❌  Array index as `key` prop.
- ❌  `useRef` for mutable data (only for DOM refs).
- ❌  `if/else` or `switch` in render logic.
- ❌  Raw `useContext` in a component — wrap in a typed custom hook.
- ❌  Mutate state in place — always spread.
- ❌  `throw` in a component body or event handler.
- ❌  `useEffect` without cleanup for subscriptions/listeners.
- ❌  Inline complex conditional JSX — extract a helper or use `ts-pattern`.
- ❌  Business logic or data fetching in presentational components.
- ❌  Unhandled async errors — every `Promise` must be `await`ed or returned.

# ───────────────────────────────────────────────────────────────
# END OF RULES
# ───────────────────────────────────────────────────────────────