import type { ParamMap, Params } from '@angular/router';
import type { ListFilter } from '../../domain/query';

export type RecordListScope = 'all' | 'lent' | 'borrowed';

export interface RecordListState {
  scope: RecordListScope;
  filter: ListFilter;
  query: string;
}

const scopes: readonly RecordListScope[] = ['all', 'lent', 'borrowed'];
const filters: readonly ListFilter[] = ['all', 'items', 'money', 'overdue', 'due_soon'];

function includesValue<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && values.some((candidate) => candidate === value);
}

function normalizeSearch(value: string | null): string {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

export function parseRecordListState(
  params: Pick<ParamMap, 'get'>,
  defaultScope: RecordListScope,
): RecordListState {
  const scope = params.get('scope');
  const filter = params.get('filter');

  return {
    scope: includesValue(scopes, scope) ? scope : defaultScope,
    filter: includesValue(filters, filter) ? filter : 'all',
    query: normalizeSearch(params.get('q')),
  };
}

export function recordListQueryParams(
  state: RecordListState,
  defaultScope: RecordListScope,
  current: Params = {},
): Params {
  const unrelated = { ...current };
  delete unrelated['scope'];
  delete unrelated['filter'];
  delete unrelated['q'];
  const query = normalizeSearch(state.query);

  return {
    ...unrelated,
    ...(state.scope === defaultScope ? {} : { scope: state.scope }),
    ...(state.filter === 'all' ? {} : { filter: state.filter }),
    ...(query ? { q: query } : {}),
  };
}
