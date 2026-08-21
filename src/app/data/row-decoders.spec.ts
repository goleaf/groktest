import { describe, expect, it } from 'vitest';
import { PersistenceCorruptionError } from './persistence-corruption';
import {
  decodeLoanEventRow,
  decodeLoanRow,
  decodeMutationRow,
  decodePersonRow,
  decodeRecordDraftRow,
  decodeRepaymentRow,
  decodeSettingsRow,
} from './row-decoders';

const createdAt = '2026-08-21T12:00:00.000Z';

const settingsRow = {
  id: 'local',
  localIdentityId: '0198ca30-2600-7000-8000-000000000001',
  preferredCurrency: 'EUR',
  preferredLanguage: 'en',
  schemaVersion: 3,
  version: 1,
  createdAt,
  updatedAt: createdAt,
};
const { localIdentityId: omittedLocalIdentityId, ...settingsWithoutLocalIdentityId } = settingsRow;
void omittedLocalIdentityId;

const personRow = {
  id: '0198ca30-2600-7000-8000-000000000002',
  displayName: 'Peter',
  phone: null,
  email: null,
  notes: null,
  createdAt,
  updatedAt: createdAt,
  version: 1,
  deletedAt: null,
};

const moneyLoanRow = {
  id: '0198ca30-2600-7000-8000-000000000003',
  direction: 'lent',
  assetKind: 'money',
  status: 'active',
  personId: personRow.id,
  personNameSnapshot: 'Peter',
  occurredOn: '2026-08-21',
  dueOn: null,
  returnedOn: null,
  note: null,
  itemName: null,
  itemDescription: null,
  quantity: null,
  currencyCode: 'EUR',
  originalMinorUnits: '12500',
  createdAt,
  updatedAt: createdAt,
  version: 1,
  deletedAt: null,
};

const repaymentRow = {
  id: '0198ca30-2600-7000-8000-000000000004',
  loanId: moneyLoanRow.id,
  minorUnits: '2500',
  currencyCode: 'EUR',
  occurredOn: '2026-08-21',
  note: null,
  createdAt,
  version: 1,
  deletedAt: null,
};

const eventRow = {
  id: '0198ca30-2600-7000-8000-000000000005',
  loanId: moneyLoanRow.id,
  type: 'repayment_added',
  summaryKey: 'history.repaymentAdded',
  summaryParamsJson: '{"amount":"2500","currency":"EUR"}',
  occurredAt: createdAt,
  createdAt,
};

const mutationRow = {
  id: '0198ca30-2600-7000-8000-000000000006',
  entityType: 'loan',
  entityId: moneyLoanRow.id,
  operation: 'upsert',
  payloadJson: '{"id":"0198ca30-2600-7000-8000-000000000003"}',
  createdAt,
  ackedAt: null,
  attempts: 0,
  lastError: null,
};

const draftRow = {
  id: 'add-record',
  direction: 'lent',
  kind: 'money',
  personName: 'Peter',
  personId: null,
  itemName: '',
  amount: '125',
  currency: 'EUR',
  dueOn: '',
  note: '',
  updatedAt: createdAt,
};

const corruptSettingsRows: readonly (readonly [
  unknown,
  string,
  PersistenceCorruptionError['reason'],
])[] = [
  [null, '$', 'expected_object'],
  [settingsWithoutLocalIdentityId, 'localIdentityId', 'missing_property'],
  [{ ...settingsRow, id: 'other' }, 'id', 'invalid_value'],
  [{ ...settingsRow, preferredCurrency: 'BTC' }, 'preferredCurrency', 'invalid_value'],
  [{ ...settingsRow, preferredLanguage: 'de' }, 'preferredLanguage', 'invalid_value'],
  [{ ...settingsRow, schemaVersion: 2 }, 'schemaVersion', 'unsupported_version'],
  [{ ...settingsRow, version: 0 }, 'version', 'invalid_value'],
  [{ ...settingsRow, updatedAt: 'yesterday' }, 'updatedAt', 'invalid_value'],
];

function expectCorruption(
  read: () => unknown,
  expected: {
    entity: PersistenceCorruptionError['entity'];
    path: string;
    reason?: PersistenceCorruptionError['reason'];
  },
): void {
  try {
    read();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(PersistenceCorruptionError);
    if (error instanceof PersistenceCorruptionError) {
      expect(error.entity).toBe(expected.entity);
      expect(error.path).toBe(expected.path);
      if (expected.reason) {
        expect(error.reason).toBe(expected.reason);
      }
      expect(error.message).not.toContain('12500');
    }
    return;
  }
  throw new Error('expected_persistence_corruption');
}

describe('persisted row decoders', () => {
  it('constructs exact domain objects from valid rows without copying unknown properties', () => {
    expect(decodeSettingsRow({ ...settingsRow, ignored: 'migration metadata' })).toEqual(
      settingsRow,
    );
    expect(decodePersonRow(personRow)).toEqual(personRow);
    expect(decodeLoanRow(moneyLoanRow)).toEqual({
      ...moneyLoanRow,
      originalMinorUnits: 12500n,
    });
    expect(decodeRepaymentRow(repaymentRow)).toEqual({ ...repaymentRow, minorUnits: 2500n });
    expect(decodeLoanEventRow(eventRow)).toEqual({
      id: eventRow.id,
      loanId: eventRow.loanId,
      type: eventRow.type,
      summaryKey: eventRow.summaryKey,
      summaryParams: { amount: '2500', currency: 'EUR' },
      occurredAt: createdAt,
      createdAt,
    });
    expect(decodeMutationRow(mutationRow)).toEqual(mutationRow);
    expect(decodeRecordDraftRow(draftRow)).toEqual(draftRow);
  });

  it.each(corruptSettingsRows)('rejects corrupt settings %#', (row, path, reason) => {
    expectCorruption(() => decodeSettingsRow(row), {
      entity: 'local_settings',
      path,
      reason,
    });
  });

  it.each([
    [{ ...personRow, displayName: '' }, 'displayName'],
    [{ ...personRow, phone: 370 }, 'phone'],
    [{ ...personRow, version: 1.5 }, 'version'],
    [{ ...personRow, deletedAt: false }, 'deletedAt'],
    [{ ...personRow, deletedAt: '2026-08-21' }, 'deletedAt'],
  ])('rejects corrupt people %#', (row, path) => {
    expectCorruption(() => decodePersonRow(row), { entity: 'person', path });
  });

  it.each([
    [{ ...moneyLoanRow, direction: 'gave' }, 'direction'],
    [{ ...moneyLoanRow, assetKind: 'service' }, 'assetKind'],
    [{ ...moneyLoanRow, status: 'done' }, 'status'],
    [{ ...moneyLoanRow, occurredOn: '2026-02-30' }, 'occurredOn'],
    [{ ...moneyLoanRow, dueOn: 1 }, 'dueOn'],
    [{ ...moneyLoanRow, originalMinorUnits: '12.50' }, 'originalMinorUnits'],
    [{ ...moneyLoanRow, originalMinorUnits: '001' }, 'originalMinorUnits'],
    [{ ...moneyLoanRow, originalMinorUnits: '9223372036854775808' }, 'originalMinorUnits'],
    [{ ...moneyLoanRow, currencyCode: null }, 'currencyCode'],
    [{ ...moneyLoanRow, quantity: 1 }, 'quantity'],
    [
      {
        ...moneyLoanRow,
        assetKind: 'physical_item',
        itemName: 'Drill',
        quantity: 1,
      },
      'currencyCode',
    ],
  ])('rejects corrupt loans %#', (row, path) => {
    expectCorruption(() => decodeLoanRow(row), { entity: 'loan', path });
  });

  it('decodes a valid physical-item row with the exact kind-specific shape', () => {
    const physical = decodeLoanRow({
      ...moneyLoanRow,
      assetKind: 'physical_item',
      itemName: 'Drill',
      itemDescription: null,
      quantity: 1,
      currencyCode: null,
      originalMinorUnits: null,
    });

    expect(physical.assetKind).toBe('physical_item');
    expect(physical.itemName).toBe('Drill');
    expect(physical.originalMinorUnits).toBeNull();
  });

  it('keeps unusual event parameter keys as inert own data properties', () => {
    const event = decodeLoanEventRow({
      ...eventRow,
      summaryParamsJson: '{"__proto__":"inert"}',
    });

    expect(Object.prototype.hasOwnProperty.call(event.summaryParams, '__proto__')).toBe(true);
    expect(event.summaryParams['__proto__']).toBe('inert');
  });

  it.each([
    [{ ...repaymentRow, minorUnits: '-1' }, 'minorUnits'],
    [{ ...repaymentRow, minorUnits: '10n' }, 'minorUnits'],
    [{ ...repaymentRow, currencyCode: 'BTC' }, 'currencyCode'],
    [{ ...repaymentRow, occurredOn: '21-08-2026' }, 'occurredOn'],
    [{ ...repaymentRow, deletedAt: undefined }, 'deletedAt'],
  ])('rejects corrupt repayments %#', (row, path) => {
    expectCorruption(() => decodeRepaymentRow(row), { entity: 'repayment', path });
  });

  it.each([
    [{ ...eventRow, type: 'loan_paid' }, 'type'],
    [{ ...eventRow, summaryParamsJson: '{' }, 'summaryParamsJson'],
    [{ ...eventRow, summaryParamsJson: '[]' }, 'summaryParamsJson'],
    [{ ...eventRow, summaryParamsJson: '{"amount":2500}' }, 'summaryParamsJson.amount'],
    [
      { ...eventRow, summaryParamsJson: '{"amount":"not-money","currency":"EUR"}' },
      'summaryParamsJson.amount',
    ],
    [{ ...eventRow, occurredAt: '2026-08-21T12:00:00Z' }, 'occurredAt'],
  ])('rejects corrupt loan events %#', (row, path) => {
    expectCorruption(() => decodeLoanEventRow(row), { entity: 'loan_event', path });
  });

  it.each([
    [{ ...mutationRow, entityType: 'draft' }, 'entityType'],
    [{ ...mutationRow, operation: 'merge' }, 'operation'],
    [{ ...mutationRow, payloadJson: '{' }, 'payloadJson'],
    [{ ...mutationRow, attempts: -1 }, 'attempts'],
    [{ ...mutationRow, ackedAt: 'later' }, 'ackedAt'],
  ])('rejects corrupt sync mutations %#', (row, path) => {
    expectCorruption(() => decodeMutationRow(row), { entity: 'sync_mutation', path });
  });

  it.each([
    [{ ...draftRow, id: 'other' }, 'id'],
    [{ ...draftRow, direction: 'gave' }, 'direction'],
    [{ ...draftRow, kind: 'service' }, 'kind'],
    [{ ...draftRow, personId: 12 }, 'personId'],
    [{ ...draftRow, currency: 'BTC' }, 'currency'],
    [{ ...draftRow, dueOn: '2026-02-30' }, 'dueOn'],
    [{ ...draftRow, updatedAt: 'today' }, 'updatedAt'],
  ])('rejects corrupt record drafts %#', (row, path) => {
    expectCorruption(() => decodeRecordDraftRow(row), { entity: 'record_draft', path });
  });
});
