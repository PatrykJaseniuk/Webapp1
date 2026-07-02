# Frontend Architecture — Master/Slave Component Rules
# ======================================================

# Apply to every masterComponent and slaveComponent you generate or modify.
# Layers on top of FUNCTIONAL_TS.md and FUNCTIONAL_TSX.md.

# ───────────────────────────────────────────────────────────────
# FILE STRUCTURE
# ───────────────────────────────────────────────────────────────

# src/
# ├── main/               App bootstrap + routing
# ├── backendConnector/   Supabase client + generated DB types
# ├── generic/            Zero-domain-knowledge shared types
# ├── hooks/              Auth context + role hooks
# ├── masterComponents/   CONTAINERS — logic, data, side effects
# ├── slaveComponents/    PURE RENDER — UI only, no logic
# └── pages/              WIRING — connect master + slave

# ───────────────────────────────────────────────────────────────
# 1. MASTER (masterComponents/) — CONTAINER
# ───────────────────────────────────────────────────────────────

- Own all side effects: `useAsync`, `useAsyncFn`, `useNavigate`.
- Define and export the slave's interface
- do not define rendering functionality
- receive slave components as argument, do not import from slaves
- do not read url params 

# ───────────────────────────────────────────────────────────────
# 2. SLAVE (slaveComponents/) — PURE RENDER
# ───────────────────────────────────────────────────────────────

- define rendering functionality
- Pure functions. Zero side effects. Zero DB knowledge. Zero application knowledge. Zero state
- Import types ONLY from: `react` + `@/generic` + their master.
- May import pure-render sibling slave components (e.g. `LoadingSpinner`, `ErrorMessage`)
  but NEVER masters, pages, or `@/backendConnector`.
- NEVER: `@/backendConnector`, `Database`, `useNavigate`, `useAsync`, `useAsyncFn`.
- have zero knowledge about url routes of whole application (url string are send by arguments)

# ───────────────────────────────────────────────────────────────
# 2a. SLAVE THREE-STATE PATTERN
# ───────────────────────────────────────────────────────────────

- Every slave that receives fetched data MUST handle three states: loading, error, data.
- Accept a single `state: SlaveDataState<T>` prop (from `@/generic`) instead of separate
  `isLoading`, `error`, `data` props.
- Use `match(state).with({ tag: 'pending' }, ...).with({ tag: 'rejected' }, ...).with({ tag: 'fulfilled' }, ...).exhaustive()`
  to guarantee every state is rendered.
- The master converts `useAsync` output into `SlaveDataState<T>` and passes it down.
  The master does NOT switch between Loading/Error/Data components — the slave does.
- All three state renderings must share the same wrapper container with a stable minimum
  height (e.g. `min-h-[300px]` for tables, `min-h-[400px]` for forms) to prevent
  layout shifts when transitioning between states.
  `LoadingSpinner` and `ErrorMessage` must fill their parent container
  (`flex items-center justify-center`) without forcing their own height.

# ───────────────────────────────────────────────────────────────
# 3. PAGE (pages/) — WIRING
# ───────────────────────────────────────────────────────────────

- url string can be compose only in page components
- router endpoint
- read params from url and send it to master as regular param
- Connect master + slave. Return a single JSX tree.
- Zero rendering logic. Zero business logic. Zero side effects.
- Do NOT pass LoadingComponent or ErrorComponent to masters — the slave handles all states.

# ───────────────────────────────────────────────────────────────
# ANTI-PATTERNS
# ───────────────────────────────────────────────────────────────

# ❌ Slave imports `@/backendConnector` or `Database`
# ❌ Slave uses `useNavigate`, `useAsync`, `useAsyncFn`
# ❌ Slave imports `PropertyRow`
# ❌ Slave holds `FormState` or any form lifecycle state
# ❌ Controlled inputs (`value`+`onChange`) in form slaves
# ❌ Slave imports anything from `pages/`
# ❌ Master switches between Loading/Error/Data components (delegate to slave)
# ❌ Page passes `LoadingComponent` or `ErrorComponent` to a master
