# Frontend Style Guide — Layer 1: Language (TypeScript)

**Scope:** ALL TypeScript code — components, hooks, utilities, constants, everywhere.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md)

---

## 1.1 Immutability

| ID | Rule | Severity |
|----|------|----------|
| L-001 | **`const` only** — no `let`, no `var`, ever | 🔴 Critical |
| L-002 | **No data mutation** — never modify objects or arrays in place | 🔴 Critical |
| L-003 | **Spread for updates** — `{ ...obj, field: value }`, `[...arr, item]` | 🔴 Critical |
| L-004 | **`as const`** for literal/config objects that never change | 🟠 High |
| L-005 | **`Readonly<T>`** for function parameters — enforce at type level | 🟡 Recommended |

```typescript
// ✅ Correct — immutable updates
const updated = { ...user, name: 'John' };
const added = [...items, newItem];
const removed = items.filter(i => i.id !== id);
const mapped = items.map(i => i.id === id ? { ...i, ...changes } : i);

// ✅ Correct — as const for lookups
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' } as const;

// ✅ Correct — readonly params
const process = (items: readonly Item[]) => items.map(i => i.name);

// ❌ Wrong — mutation
items.push(newItem);
user.name = 'John';
arr.splice(0, 1);

// ❌ Wrong — let/var
let count = 0;
var name = 'test';
```

---

## 1.2 Functional Style

| ID | Rule | Severity |
|----|------|----------|
| L-006 | **Arrow functions** — `const fn = () => {}` for all functions | 🔴 Critical |
| L-007 | **No classes** — purely functional, no `class` keyword | 🔴 Critical |
| L-008 | **No `enum`** — use union types or `as const` objects instead | 🔴 Critical |
| L-009 | **No loops** — no `for`, `while`, `forEach`; use `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()` | 🔴 Critical |
| L-010 | **Pure utility functions** — no side effects in `utils/` files | 🟠 High |

```typescript
// ✅ Correct — arrow functions
export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('pl-PL');

export const calculateTotal = (items: readonly Item[]): number =>
  items.reduce((sum, item) => sum + item.amount, 0);

// ✅ Correct — union type instead of enum
type Status = 'active' | 'inactive' | 'pending';

// ✅ Correct — as const object instead of enum
const PAYMENT_METHOD = {
  CASH: 'cash',
  TRANSFER: 'bank_transfer',
  CARD: 'card',
} as const;
type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

// ✅ Correct — functional iteration
const names = items.map(item => item.name);
const active = items.filter(item => item.status === 'active');
const found = items.find(item => item.id === targetId);
const hasOverdue = items.some(item => item.status === 'overdue');
const total = items.reduce((sum, item) => sum + item.amount, 0);

// ❌ Wrong — class
class UserService { ... }

// ❌ Wrong — enum
enum Status { Active, Inactive }

// ❌ Wrong — imperative loop
for (const item of items) { ... }
items.forEach(item => { ... });
while (condition) { ... }

// ❌ Wrong — function keyword
function formatDate(date: string) { ... }
```

> **Exception:** Next.js page/layout files require `export default function` — this is the only place `function` keyword is allowed. See [Framework Guide § 3.3](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md#33-use-client-directive).

---

## 1.3 Control Flow

| ID | Rule | Severity |
|----|------|----------|
| L-011 | **No `if`/`else`** — use ternary `? :`, `&&`, `\|\|`, `??` | 🔴 Critical |
| L-012 | **No `switch`** — use object lookup maps | 🔴 Critical |
| L-013 | **Single return** — functions return once at the end, no early returns | 🔴 Critical |
| L-014 | **Nullish coalescing `??`** — for default values | 🟠 High |
| L-015 | **Optional chaining `?.`** — for safe property access | 🟠 High |

### Ternary instead of if/else

```typescript
// ✅ Correct
const label = status === 'active' ? 'Active' : 'Inactive';
const display = isLoading ? 'Loading...' : `Found ${count} items`;

// ✅ Correct — chained ternary for multiple conditions
const color =
  status === 'active' ? 'green' :
  status === 'pending' ? 'yellow' :
  'red';

// ❌ Wrong
if (status === 'active') { ... } else { ... }
```

### Logical operators instead of if

```typescript
// ✅ Correct — && for conditional execution
const result = isValid && doSomething();

// ✅ Correct — || for fallback
const name = inputName || 'Anonymous';

// ✅ Correct — ?? for nullish defaults (null/undefined only)
const name = user?.name ?? 'Anonymous';
const count = data?.length ?? 0;
```

### Object lookup instead of switch

```typescript
// ✅ Correct
const STATUS_LABELS: Record<string, string> = {
  active: 'Aktywny',
  inactive: 'Nieaktywny',
  pending: 'Oczekujący',
};
const getLabel = (status: string): string => STATUS_LABELS[status] ?? 'Nieznany';

// ❌ Wrong
switch (status) {
  case 'active': return 'Aktywny';
  case 'inactive': return 'Nieaktywny';
  default: return 'Nieznany';
}
```

### Single return — no early returns

```typescript
// ✅ Correct — single return with expressions
const getValue = (input: string | null): string => input ?? 'default';

const processItem = (item: Item) => {
  const validated = item.name.length > 0 ? item : { ...item, name: 'Unnamed' };
  const formatted = { ...validated, label: validated.name.toUpperCase() };
  return formatted;
};

// ❌ Wrong — early return (requires if)
const getValue = (input: string | null) => {
  if (!input) return 'default';
  return input;
};
```

---

## 1.4 Error Handling

| ID | Rule | Severity |
|----|------|----------|
| L-016 | **No `try-catch`**  | 🔴 Critical |
| L-017 | **Result pattern** — functions return `{ data, error }` not throw | 🔴 Critical |


---

## 1.5 Type Safety

| ID | Rule | Severity |
|----|------|----------|
| L-018 | **No `any`** — use `unknown` when type is uncertain | 🔴 Critical |
| L-019 | **No non-null assertion `!`** — use `??` or `?.` instead | 🔴 Critical |
| L-020 | **`import type`** — use for type-only imports | 🟠 High |
| L-021 | **Template literals** — prefer `` `text ${var}` `` over `'text ' + var` | 🟡 Recommended |

```typescript
// ✅ Correct
import type { Database } from '@/api/database.types';
import type { User, Session } from '@supabase/supabase-js';

const parse = (input: unknown) => typeof input === 'string' ? input : '';
const name = user?.profile?.name ?? 'Unknown';
const greeting = `Hello ${name}`;

// ❌ Wrong
import { Database } from '@/api/database.types';  // not type-only
const data: any = response;
const name = user!.name;
const greeting = 'Hello ' + name;
```

---

## 1.6 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `itemCount`, `userName` |
| Functions | camelCase | `formatDate`, `getUserName` |
| Constants (config/lookups) | UPPER_SNAKE_CASE | `MAX_ITEMS`, `STATUS_LABELS` |
| Types / Interfaces | PascalCase | `User`, `ButtonProps`, `LeaseStatus` |
| Union type aliases | PascalCase | `type Status = 'active' \| 'inactive'` |
| Component files | PascalCase | `Button.tsx`, `ItemList.tsx` |
| Hook files | camelCase with `use` prefix | `useAuth.ts`, `useItems.ts` |
| Utility files | camelCase | `formatDate.ts`, `validators.ts` |
| CSS Module files | camelCase matching pattern group | `form.module.css`, `shared.module.css` |
| CSS class names | camelCase | `.cardHeader`, `.buttonPrimary` |
| Env variables | UPPER_SNAKE_CASE with `NEXT_PUBLIC_` | `NEXT_PUBLIC_SUPABASE_URL` |

---

## Summary — What's Banned

| ❌ Banned | ✅ Use Instead |
|-----------|----------------|
| `let`, `var` | `const` |
| `if`/`else` | `? :`, `&&`, `\|\|`, `??` |
| `switch` | Object lookup map |
| `for`, `while`, `forEach` | `.map()`, `.filter()`, `.reduce()`, `.find()` |
| `try-catch` | `{ data, error }`, `.catch()` |
| `class` | Arrow functions, plain objects |
| `enum` | Union types, `as const` objects |
| `any` | `unknown` |
| `!` (non-null assertion) | `??`, `?.` |
| `function` keyword | Arrow functions (`const fn = () => {}`) |
| Early returns | Single return with expressions |
| String concatenation | Template literals |
| Data mutation | Spread syntax, `.map()`, `.filter()` |
