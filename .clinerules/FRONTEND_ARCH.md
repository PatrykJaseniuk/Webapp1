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
- Pure functions. Zero side effects. Zero DB knowledge. Zero apication knowledge. Zero state
- Import types ONLY from: `react` + their master.
- NEVER: `@/backendConnector`, `Database`, `useNavigate`, `useAsync`, `useAsyncFn`.
- have zero knowledge about url routes of whole application (url string are send by arguments) 

# ───────────────────────────────────────────────────────────────
# 3. PAGE (pages/) — WIRING
# ───────────────────────────────────────────────────────────────

- url string can be compose only in page components
- router endpoint
- read params from url and send it to master as regular param
- Connect master + slave. Return a single JSX tree.
- Zero rendering logic. Zero business logic. Zero side effects.

# ───────────────────────────────────────────────────────────────
# ANTI-PATTERNS
# ───────────────────────────────────────────────────────────────

# ❌ Slave imports `@/backendConnector` or `Database`
# ❌ Slave uses `useNavigate`, `useAsync`, `useAsyncFn`
# ❌ Slave imports `PropertyRow`
# ❌ Slave holds `FormState` or any form lifecycle state
# ❌ Controlled inputs (`value`+`onChange`) in form slaves
# ❌ Slave imports anything from `pages/`