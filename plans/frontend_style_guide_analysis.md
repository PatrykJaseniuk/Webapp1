# Frontend Style Guide Analysis & Recommendations

**Date:** 2026-02-18  
**Document Analyzed:** [`doc/FRONTEND_STYLE_GUIDE.md`](doc/FRONTEND_STYLE_GUIDE.md)  
**Current Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase JS 2.91.x | react-use 17.6.x

---

## Executive Summary

The Frontend Style Guide is well-structured with clear rules, good examples, and helpful decision trees. However, several areas could benefit from expansion or modernization to improve developer experience, code quality, and maintainability.

---

## 1. Missing Sections - High Priority

### 1.1 Testing Guidelines 🔴 Critical

The guide has **no testing strategy**. This is a significant gap for a production application.

**Recommendations:**
- Add testing toolstack: Vitest + React Testing Library + Playwright/Cypress
- Define testing patterns for components, hooks, and utilities
- Establish coverage thresholds
- Document mocking strategies for Supabase

```typescript
// Example testing pattern to add
// components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### 1.2 Accessibility Guidelines 🔴 Critical

No accessibility (a11y) rules exist. This is essential for production applications.

**Recommendations:**
- Add a11y rule: All interactive elements must have accessible names
- Add a11y rule: Form inputs must have associated labels
- Add a11y rule: Color contrast must meet WCAG 2.1 AA
- Add a11y rule: Focus management for modals and dynamic content
- Consider adding eslint-plugin-jsx-a11y

```typescript
// Add to Quick Reference table:
| F-012 | **Accessibility compliance** — WCAG 2.1 AA, semantic HTML, ARIA when needed | 🔴 Critical |
```

### 1.3 Form Handling Patterns 🟠 High

Only basic form example exists. Complex forms need more guidance.

**Recommendations:**
- Add comprehensive form patterns (validation, multi-step, nested forms)
- Consider recommending React Hook Form or Zod for validation
- Document form error display patterns
- Add form accessibility patterns

---

## 2. Missing Sections - Medium Priority

### 2.1 Performance Guidelines 🟡 Medium

Limited performance optimization guidance exists.

**Recommendations:**
- Add rules for React.memo usage
- Document useMemo and useCallback patterns
- Add bundle size monitoring guidance
- Document image optimization for static export
- Add Core Web Vitals targets

```typescript
// Add to Quick Reference table:
| F-013 | **Memoize expensive computations** — use useMemo for derived data | 🟡 Medium |
| F-014 | **Optistic updates** — update UI before server confirmation for better UX | 🟡 Medium |
```

### 2.2 State Management Strategy 🟡 Medium

Only local state is documented. No guidance for shared/global state.

**Recommendations:**
- Document when to lift state up
- Add Context API patterns for shared state
- Consider recommending Zustand for complex global state
- Document URL state synchronization patterns

### 2.3 Responsive Design 🟡 Medium

No responsive design guidelines exist despite having CSS modules.

**Recommendations:**
- Add responsive breakpoint tokens to globals.css
- Document mobile-first CSS approach
- Add responsive component patterns

```css
/* Add to globals.css */
:root {
    /* Breakpoints */
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;
    --breakpoint-xl: 1280px;
}
```

### 2.4 Internationalization (i18n) 🟡 Medium

Code contains Polish strings (e.g., "Ładowanie...", "Brak danych", "Błąd:") but no i18n strategy.

**Recommendations:**
- Either commit to Polish-only and document it
- Or add i18n library recommendation (next-intl, react-intl)
- Centralize all strings into constants or translation files

---

## 3. Rule Refinements

### 3.1 F-004: No if Statements - Too Restrictive 🟠 High

**Current Rule:** No `if` statements in component/hook logic

**Issue:** The codebase itself violates this. [`DataTable.tsx`](frontend/src/components/shared/DataTable.tsx:43) uses ternaries but the pattern becomes unreadable for complex conditions.

**Recommendation:** Refine the rule to allow `if` for:
- Early returns in helper functions
- Guard clauses
- Complex conditional logic where ternaries hurt readability

```typescript
// Allow this pattern for readability:
const getCellValue = <T,>(row: T, key: string): unknown => {
    if (!row || typeof row !== 'object') return undefined;
    // ... rest of logic
};
```

### 3.2 Helper Functions in Components 🟡 Medium

**Issue:** [`DataTable.tsx`](frontend/src/components/shared/DataTable.tsx:107) contains `formatCurrencyValue` and `formatDateValue` which should be in utils.

**Recommendation:** Add rule that utility functions should not be defined in component files.

```
| F-015 | **Utility functions in utils/** — no helper functions in component files | 🟡 Medium |
```

### 3.3 TypeScript Strictness 🟡 Medium

**Recommendation:** Add TypeScript configuration rules:
- Enable strict mode
- Enable noImplicitAny
- Enable strictNullChecks
- Document when to use `unknown` vs `any`

---

## 4. Modern Practices to Consider

### 4.1 Data Fetching Evolution 🟠 High

**Current:** react-use (`useAsync`, `useAsyncFn`)

**Consider:** TanStack Query (React Query)
- Better caching and deduplication
- Built-in devtools
- Optimistic updates
- Better TypeScript support

**Recommendation:** Evaluate TanStack Query for complex data requirements, keep react-use for simpler use cases.

### 4.2 Form Validation 🟡 Medium

**Consider:** Zod for schema validation
- Runtime type checking
- TypeScript inference
- Form integration with React Hook Form

```typescript
// Example Zod integration
import { z } from 'zod';

const propertySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    rent: z.number().positive('Rent must be positive'),
});
```

### 4.3 Component Library 🟡 Medium

**Consider:** Adding a component library for consistency
- Radix UI (headless, accessible)
- shadcn/ui (Radix + Tailwind)
- Or document building custom components

---

## 5. Code Quality Tooling

### 5.1 ESLint Configuration 🔴 Critical

No ESLint configuration documented.

**Recommendations:**
- Document ESLint setup
- Add recommended presets:
  - `eslint:recommended`
  - `@typescript-eslint/recommended`
  - `plugin:react-hooks/recommended`
  - `plugin:jsx-a11y/recommended`

### 5.2 Prettier Configuration 🟡 Medium

No code formatting standards documented.

**Recommendations:**
- Add Prettier configuration
- Document formatting rules
- Add pre-commit hooks with lint-staged

### 5.3 Husky/Pre-commit Hooks 🟡 Medium

**Recommendations:**
- Add pre-commit checks
- Run linting and tests before commits
- Consider commitlint for conventional commits

---

## 6. Documentation Improvements

### 6.1 JSDoc Standards 🟡 Medium

Add documentation standards for complex functions:

```typescript
/**
 * Formats a currency value for display
 * @param amount - The amount to format, can be null/undefined
 * @returns Formatted currency string or em-dash for nullish values
 * @example
 * formatCurrencyValue(1234.56) // '1 234,56 zł'
 * formatCurrencyValue(null) // '—'
 */
export const formatCurrencyValue = (amount: number | null | undefined): string => {
    // ...
};
```

### 6.2 Component Documentation 🟡 Medium

Add Storybook or similar for component documentation.

---

## 7. Architecture Considerations

### 7.1 Error Boundaries 🟠 High

No error boundary pattern documented for React 19.

**Recommendations:**
- Add error boundary component pattern
- Document error recovery strategies
- Add error logging integration

### 7.2 Loading States 🟡 Medium

Expand loading state patterns:
- Skeleton components
- Progressive loading
- Suspense boundaries (React 19 feature)

### 7.3 SEO for Static Export 🟡 Medium

Limited SEO guidance for static export.

**Recommendations:**
- Document metadata API usage
- Add sitemap generation
- Document Open Graph patterns

---

## Summary: Recommended Quick Reference Additions

| Rule ID | Rule | Severity |
|---------|------|----------|
| F-012 | **Accessibility compliance** — WCAG 2.1 AA, semantic HTML, ARIA when needed | 🔴 Critical |
| F-013 | **Testing required** — unit tests for hooks/utils, integration tests for components | 🔴 Critical |
| F-014 | **Utility functions in utils/** — no helper functions in component files | 🟡 Medium |
| F-015 | **Memoize expensive computations** — use useMemo for derived data | 🟡 Medium |
| F-016 | **Error boundaries** — wrap route segments with error boundaries | 🟠 High |
| F-017 | **Form validation** — use Zod schemas for form validation | 🟡 Medium |

---

## Implementation Priority

1. **Immediate:** Add testing guidelines, accessibility rules, ESLint configuration
2. **Short-term:** Refine F-004 rule, add form patterns, error boundaries
3. **Medium-term:** Performance guidelines, state management, responsive design
4. **Long-term:** Consider TanStack Query, component library, Storybook

---

## Questions for Discussion

1. Should we commit to Polish-only UI or implement i18n?
2. Is TanStack Query worth the migration effort from react-use?
3. Do we need a component library or continue with custom CSS Modules?
4. What testing framework should we standardize on?
5. Should we relax F-004 to allow `if` in specific cases?
