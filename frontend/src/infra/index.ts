// ── Infra layer — Supabase data adapters ──
// Effectful I/O boundary. All Supabase calls live here.
// Naming convention: verbs that imply side effects (fetchX, saveX).

import { database } from '@/api/database';
import type { Database } from '@/api/database.types';

export type { Database };
export { database };