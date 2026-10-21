import { useState } from 'react';
import { match } from 'ts-pattern';
import { useMutation } from '@tanstack/react-query';
import type { ZodType } from 'zod';
import { formatZodIssues } from './zod';
import { type DetailMode } from './detailMode';

/**
 * The shared CRUD mutation lifecycle for detail masters.
 *
 * Encapsulates the three `useMutation` blocks (insert / update / delete), the
 * `onEditStart` reset, the `doSubmit` validation-and-mutate handler, and the
 * `validationError` state — all of which were duplicated across the five
 * detail masters.
 *
 * The master keeps ownership of:
 *  - the DB calls (`insertFn` / `updateFn` / `deleteFn` — thin per-entity
 *    wrappers over `backendConnector`),
 *  - query invalidation + navigation (`onInsertSuccess` / `onUpdateSuccess` /
 *    `onDeleteSuccess` closures that call `invalidateQueries` and `navigate`),
 *  - the per-entity entity-specific validation (`onAfterValidate`).
 *
 * `TRow` is the DB row type; `schema.safeParse`'s output is expected to be
 * assignable to it (it already is — the original masters call
 * `insertMutation.mutate(data)` with that same `data`).
 */
export type UseCrudMutationsParams<TRow> = {
  readonly insertFn: (newRecord: TRow) => Promise<string>;
  readonly updateFn: (id: string, record: TRow) => Promise<void>;
  readonly deleteFn: (id: string) => Promise<void>;
  readonly schema: ZodType<TRow>;
  readonly mode: DetailMode;
  /**
   * Optional entity-specific validation, run AFTER the zod schema passes.
   * Return `null` to proceed, or a Polish error message to block submission
   * (it is stored as the `validationError`). Used by FinancialEntryM for the
   * lease↔property mismatch check.
   */
  readonly onAfterValidate?: (record: TRow) => string | null;
  readonly onInsertSuccess: (newId: string) => void;
  readonly onUpdateSuccess: (id: string) => void;
  readonly onDeleteSuccess: (id: string) => void;
};

export const useCrudMutations = <TRow>(params: UseCrudMutationsParams<TRow>) => {
  const { insertFn, updateFn, deleteFn, schema, mode, onAfterValidate, onInsertSuccess, onUpdateSuccess, onDeleteSuccess } = params;
  const [validationError, setValidationError] = useState<string | null>(null);

  const insertMutation = useMutation({
    mutationFn: (newRecord: TRow): Promise<string> => insertFn(newRecord),
    onSuccess: (newId) => {
      onInsertSuccess(newId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, record }: { readonly id: string; readonly record: TRow }): Promise<void> =>
      updateFn(id, record),
    onSuccess: (_data, variables) => {
      onUpdateSuccess(variables.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string): Promise<void> => deleteFn(id),
    onSuccess: (_data, id) => {
      onDeleteSuccess(id);
    },
  });

  const onEditStart = (): void => {
    insertMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setValidationError(null);
  };

  const doSubmit = (newRecord: unknown): void =>
    match(schema.safeParse(newRecord))
      .with(
        { success: true },
        ({ data }) => {
          const extraError = onAfterValidate === undefined ? null : onAfterValidate(data);
          setValidationError(extraError);
          const proceed = extraError === null;
          const act = (): void =>
            match(mode)
              .with({ tag: 'create' }, () => { insertMutation.mutate(data); })
              .with({ tag: 'edit' }, ({ id }) => { updateMutation.mutate({ id, record: data }); })
              .exhaustive();
          (proceed === true ? act() : undefined);
        },
      )
      .with(
        { success: false },
        ({ error }) => {
          setValidationError(formatZodIssues(error));
        },
      )
      .exhaustive();

  return {
    insertMutation,
    updateMutation,
    deleteMutation,
    validationError,
    doSubmit,
    onEditStart,
  };
};

