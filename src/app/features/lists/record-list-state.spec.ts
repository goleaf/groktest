import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { parseRecordListState, recordListQueryParams } from './record-list-state';

describe('record list URL state', () => {
  it('parses supported scope, filter, and normalized search values', () => {
    expect(
      parseRecordListState(
        convertToParamMap({ scope: 'borrowed', filter: 'overdue', q: '  angle   grinder  ' }),
        'all',
      ),
    ).toEqual({ scope: 'borrowed', filter: 'overdue', query: 'angle grinder' });
  });

  it('falls back to route defaults for unsupported values', () => {
    expect(
      parseRecordListState(convertToParamMap({ scope: 'mine', filter: 'late' }), 'lent'),
    ).toEqual({ scope: 'lent', filter: 'all', query: '' });
  });

  it('omits defaults and empty search while preserving unrelated parameters', () => {
    expect(
      recordListQueryParams({ scope: 'lent', filter: 'all', query: '   ' }, 'lent', {
        scope: 'borrowed',
        filter: 'money',
        q: 'old',
        campaign: 'local',
      }),
    ).toEqual({ campaign: 'local' });
  });

  it('serializes non-default values and collapses search whitespace', () => {
    expect(
      recordListQueryParams(
        { scope: 'borrowed', filter: 'due_soon', query: '  Peter   drill ' },
        'all',
        { language: 'ru' },
      ),
    ).toEqual({ language: 'ru', scope: 'borrowed', filter: 'due_soon', q: 'Peter drill' });
  });
});
