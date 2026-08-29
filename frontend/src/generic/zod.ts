import type { ZodError } from 'zod';

/**
 * Joins every zod issue message into a single `'; '`-separated string,
 * suitable for display in a form validation error banner.
 *
 * Replaces the 5 identical local `formatZodIssues` helpers that lived in each
 * detail master.
 */
export const formatZodIssues = (error: ZodError): string =>
  error.issues.map((issue) => issue.message).join('; ');
