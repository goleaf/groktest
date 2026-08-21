import { isCalendarDate, type CalendarDate, type Instant } from '../domain/calendar-date';
import { INPUT_LIMITS, MAX_MINOR_UNITS } from '../domain/config';
import { isCurrencyCode, type CurrencyCode } from '../domain/money';
import type {
  AssetKind,
  Loan,
  LoanDirection,
  LoanEvent,
  LoanEventType,
  LocalSettings,
  Person,
  RecordDraft,
  Repayment,
  StoredLoanStatus,
  SyncEntityType,
  SyncMutation,
} from '../domain/types';
import { isSupportedLanguage } from '../i18n/catalog';
import { LOCAL_SCHEMA_VERSION } from './database';
import {
  PersistenceCorruptionError,
  type PersistenceCorruptionReason,
  type PersistedEntity,
} from './persistence-corruption';

type UnknownRecord = Readonly<Record<string, unknown>>;

interface DecodeContext {
  readonly entity: PersistedEntity;
}

const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const POSITIVE_DECIMAL_PATTERN = /^[1-9]\d*$/;

const LOAN_DIRECTIONS = ['lent', 'borrowed'] as const;
const ASSET_KINDS = ['physical_item', 'money'] as const;
const LOAN_STATUSES = ['active', 'completed', 'cancelled', 'archived'] as const;
const LOAN_EVENT_TYPES = [
  'loan_created',
  'repayment_added',
  'item_returned',
  'due_date_changed',
  'note_changed',
  'loan_cancelled',
  'loan_archived',
  'loan_reopened',
] as const;
const SYNC_ENTITY_TYPES = ['person', 'loan', 'repayment', 'loan_event', 'settings'] as const;
const MUTATION_OPERATIONS = ['upsert', 'delete'] as const;

function corrupt(
  context: DecodeContext,
  path: string,
  reason: PersistenceCorruptionReason,
  cause?: unknown,
): never {
  throw new PersistenceCorruptionError(
    context.entity,
    path,
    reason,
    cause === undefined ? undefined : { cause },
  );
}

function isUnknownRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeObject(value: unknown, context: DecodeContext): UnknownRecord {
  if (!isUnknownRecord(value)) {
    return corrupt(context, '$', 'expected_object');
  }
  return value;
}

function property(record: UnknownRecord, key: string, context: DecodeContext): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return corrupt(context, key, 'missing_property');
  }
  return record[key];
}

function decodeString(record: UnknownRecord, key: string, context: DecodeContext): string {
  const value = property(record, key, context);
  if (typeof value !== 'string') {
    return corrupt(context, key, 'invalid_type');
  }
  return value;
}

function decodeNonEmptyString(record: UnknownRecord, key: string, context: DecodeContext): string {
  const value = decodeString(record, key, context);
  if (value.length === 0) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeNullableString(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): string | null {
  const value = property(record, key, context);
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return corrupt(context, key, 'invalid_type');
  }
  return value;
}

function decodeInteger(record: UnknownRecord, key: string, context: DecodeContext): number {
  const value = property(record, key, context);
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodePositiveInteger(record: UnknownRecord, key: string, context: DecodeContext): number {
  const value = decodeInteger(record, key, context);
  if (value < 1) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeNonNegativeInteger(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): number {
  const value = decodeInteger(record, key, context);
  if (value < 0) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeEnum<const Value extends string>(
  record: UnknownRecord,
  key: string,
  allowed: readonly Value[],
  context: DecodeContext,
): Value {
  const value = decodeString(record, key, context);
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    return corrupt(context, key, 'invalid_value');
  }
  return match;
}

function decodeExactString<const Value extends string>(
  record: UnknownRecord,
  key: string,
  expected: Value,
  context: DecodeContext,
): Value {
  const value = decodeString(record, key, context);
  if (value !== expected) {
    return corrupt(context, key, 'invalid_value');
  }
  return expected;
}

function decodeCalendarDate(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): CalendarDate {
  const value = decodeString(record, key, context);
  if (!isCalendarDate(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeNullableCalendarDate(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): CalendarDate | null {
  const value = property(record, key, context);
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return corrupt(context, key, 'invalid_type');
  }
  if (!isCalendarDate(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function isCanonicalInstant(value: string): boolean {
  if (!INSTANT_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function decodeInstant(record: UnknownRecord, key: string, context: DecodeContext): Instant {
  const value = decodeString(record, key, context);
  if (!isCanonicalInstant(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeNullableInstant(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): Instant | null {
  const value = property(record, key, context);
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return corrupt(context, key, 'invalid_type');
  }
  if (!isCanonicalInstant(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeCurrency(record: UnknownRecord, key: string, context: DecodeContext): CurrencyCode {
  const value = decodeString(record, key, context);
  if (!isCurrencyCode(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function decodeSupportedLanguage(record: UnknownRecord, key: string, context: DecodeContext) {
  const value = decodeString(record, key, context);
  if (!isSupportedLanguage(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  return value;
}

function positiveMinorUnitsFromString(value: string, path: string, context: DecodeContext): bigint {
  if (!POSITIVE_DECIMAL_PATTERN.test(value)) {
    return corrupt(context, path, 'invalid_value');
  }
  if (value.length > MAX_MINOR_UNITS.toString().length) {
    return corrupt(context, path, 'out_of_range');
  }
  const minorUnits = BigInt(value);
  if (minorUnits > MAX_MINOR_UNITS) {
    return corrupt(context, path, 'out_of_range');
  }
  return minorUnits;
}

function decodePositiveMinorUnits(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): bigint {
  const value = decodeString(record, key, context);
  return positiveMinorUnitsFromString(value, key, context);
}

function decodeNull(record: UnknownRecord, key: string, context: DecodeContext): null {
  if (property(record, key, context) !== null) {
    return corrupt(context, key, 'invalid_value');
  }
  return null;
}

function parseJson(json: string, path: string, context: DecodeContext): unknown {
  try {
    return JSON.parse(json);
  } catch (cause: unknown) {
    return corrupt(context, path, 'invalid_json', cause);
  }
}

function decodeJsonStringRecord(
  record: UnknownRecord,
  key: string,
  context: DecodeContext,
): Readonly<Record<string, string>> {
  const json = decodeString(record, key, context);
  const value = parseJson(json, key, context);
  if (!isUnknownRecord(value)) {
    return corrupt(context, key, 'invalid_value');
  }
  const decodedEntries: [string, string][] = [];
  for (const [name, parameter] of Object.entries(value)) {
    if (typeof parameter !== 'string') {
      return corrupt(context, `${key}.${name}`, 'invalid_type');
    }
    decodedEntries.push([name, parameter]);
  }
  return Object.fromEntries(decodedEntries);
}

function validateEventSummaryParams(
  params: Readonly<Record<string, string>>,
  context: DecodeContext,
): void {
  const amount = params['amount'];
  if (amount !== undefined && amount !== '') {
    positiveMinorUnitsFromString(amount, 'summaryParamsJson.amount', context);
  }
  const currency = params['currency'];
  if (currency !== undefined && currency !== '' && !isCurrencyCode(currency)) {
    corrupt(context, 'summaryParamsJson.currency', 'invalid_value');
  }
  const date = params['date'];
  if (date !== undefined && date !== '' && !isCalendarDate(date)) {
    corrupt(context, 'summaryParamsJson.date', 'invalid_value');
  }
}

function validateJsonString(record: UnknownRecord, key: string, context: DecodeContext): string {
  const json = decodeString(record, key, context);
  parseJson(json, key, context);
  return json;
}

export function decodeSettingsRow(value: unknown): LocalSettings {
  const context = { entity: 'local_settings' } as const;
  const row = decodeObject(value, context);
  const schemaVersion = decodePositiveInteger(row, 'schemaVersion', context);
  if (schemaVersion !== LOCAL_SCHEMA_VERSION) {
    return corrupt(context, 'schemaVersion', 'unsupported_version');
  }
  const preferredLanguage = decodeSupportedLanguage(row, 'preferredLanguage', context);
  return {
    id: decodeExactString(row, 'id', 'local', context),
    localIdentityId: decodeNonEmptyString(row, 'localIdentityId', context),
    preferredCurrency: decodeCurrency(row, 'preferredCurrency', context),
    preferredLanguage,
    schemaVersion,
    version: decodePositiveInteger(row, 'version', context),
    createdAt: decodeInstant(row, 'createdAt', context),
    updatedAt: decodeInstant(row, 'updatedAt', context),
  };
}

export function decodePersonRow(value: unknown): Person {
  const context = { entity: 'person' } as const;
  const row = decodeObject(value, context);
  return {
    id: decodeNonEmptyString(row, 'id', context),
    displayName: decodeNonEmptyString(row, 'displayName', context),
    phone: decodeNullableString(row, 'phone', context),
    email: decodeNullableString(row, 'email', context),
    notes: decodeNullableString(row, 'notes', context),
    createdAt: decodeInstant(row, 'createdAt', context),
    updatedAt: decodeInstant(row, 'updatedAt', context),
    version: decodePositiveInteger(row, 'version', context),
    deletedAt: decodeNullableInstant(row, 'deletedAt', context),
  };
}

export function decodeLoanRow(value: unknown): Loan {
  const context = { entity: 'loan' } as const;
  const row = decodeObject(value, context);
  const direction: LoanDirection = decodeEnum(row, 'direction', LOAN_DIRECTIONS, context);
  const assetKind: AssetKind = decodeEnum(row, 'assetKind', ASSET_KINDS, context);
  const status: StoredLoanStatus = decodeEnum(row, 'status', LOAN_STATUSES, context);
  const occurredOn = decodeCalendarDate(row, 'occurredOn', context);
  const dueOn = decodeNullableCalendarDate(row, 'dueOn', context);
  const returnedOn = decodeNullableCalendarDate(row, 'returnedOn', context);
  if (dueOn !== null && dueOn < occurredOn) {
    return corrupt(context, 'dueOn', 'invalid_value');
  }
  if (returnedOn !== null && returnedOn < occurredOn) {
    return corrupt(context, 'returnedOn', 'invalid_value');
  }

  const common = {
    id: decodeNonEmptyString(row, 'id', context),
    direction,
    assetKind,
    status,
    personId: decodeNonEmptyString(row, 'personId', context),
    personNameSnapshot: decodeNonEmptyString(row, 'personNameSnapshot', context),
    occurredOn,
    dueOn,
    returnedOn,
    note: decodeNullableString(row, 'note', context),
    createdAt: decodeInstant(row, 'createdAt', context),
    updatedAt: decodeInstant(row, 'updatedAt', context),
    version: decodePositiveInteger(row, 'version', context),
    deletedAt: decodeNullableInstant(row, 'deletedAt', context),
  };

  if (assetKind === 'physical_item') {
    const itemName = decodeNonEmptyString(row, 'itemName', context);
    const itemDescription = decodeNullableString(row, 'itemDescription', context);
    const quantity = decodePositiveInteger(row, 'quantity', context);
    if (quantity > INPUT_LIMITS.quantity) {
      return corrupt(context, 'quantity', 'out_of_range');
    }
    return {
      ...common,
      itemName,
      itemDescription,
      quantity,
      currencyCode: decodeNull(row, 'currencyCode', context),
      originalMinorUnits: decodeNull(row, 'originalMinorUnits', context),
    };
  }

  return {
    ...common,
    itemName: decodeNull(row, 'itemName', context),
    itemDescription: decodeNull(row, 'itemDescription', context),
    quantity: decodeNull(row, 'quantity', context),
    currencyCode: decodeCurrency(row, 'currencyCode', context),
    originalMinorUnits: decodePositiveMinorUnits(row, 'originalMinorUnits', context),
  };
}

export function decodeRepaymentRow(value: unknown): Repayment {
  const context = { entity: 'repayment' } as const;
  const row = decodeObject(value, context);
  return {
    id: decodeNonEmptyString(row, 'id', context),
    loanId: decodeNonEmptyString(row, 'loanId', context),
    minorUnits: decodePositiveMinorUnits(row, 'minorUnits', context),
    currencyCode: decodeCurrency(row, 'currencyCode', context),
    occurredOn: decodeCalendarDate(row, 'occurredOn', context),
    note: decodeNullableString(row, 'note', context),
    createdAt: decodeInstant(row, 'createdAt', context),
    version: decodePositiveInteger(row, 'version', context),
    deletedAt: decodeNullableInstant(row, 'deletedAt', context),
  };
}

export function decodeLoanEventRow(value: unknown): LoanEvent {
  const context = { entity: 'loan_event' } as const;
  const row = decodeObject(value, context);
  const type: LoanEventType = decodeEnum(row, 'type', LOAN_EVENT_TYPES, context);
  const summaryParams = decodeJsonStringRecord(row, 'summaryParamsJson', context);
  validateEventSummaryParams(summaryParams, context);
  return {
    id: decodeNonEmptyString(row, 'id', context),
    loanId: decodeNonEmptyString(row, 'loanId', context),
    type,
    summaryKey: decodeNonEmptyString(row, 'summaryKey', context),
    summaryParams,
    occurredAt: decodeInstant(row, 'occurredAt', context),
    createdAt: decodeInstant(row, 'createdAt', context),
  };
}

export function isPendingMutationRow(value: unknown): boolean {
  const context = { entity: 'sync_mutation' } as const;
  const row = decodeObject(value, context);
  return decodeNullableInstant(row, 'ackedAt', context) === null;
}

export function decodeMutationRow(value: unknown): SyncMutation {
  const context = { entity: 'sync_mutation' } as const;
  const row = decodeObject(value, context);
  const entityType: SyncEntityType = decodeEnum(row, 'entityType', SYNC_ENTITY_TYPES, context);
  return {
    id: decodeNonEmptyString(row, 'id', context),
    entityType,
    entityId: decodeNonEmptyString(row, 'entityId', context),
    operation: decodeEnum(row, 'operation', MUTATION_OPERATIONS, context),
    payloadJson: validateJsonString(row, 'payloadJson', context),
    createdAt: decodeInstant(row, 'createdAt', context),
    ackedAt: decodeNullableInstant(row, 'ackedAt', context),
    attempts: decodeNonNegativeInteger(row, 'attempts', context),
    lastError: decodeNullableString(row, 'lastError', context),
  };
}

export function decodeRecordDraftRow(value: unknown): RecordDraft {
  const context = { entity: 'record_draft' } as const;
  const row = decodeObject(value, context);
  const dueOn = decodeString(row, 'dueOn', context);
  if (dueOn !== '' && !isCalendarDate(dueOn)) {
    return corrupt(context, 'dueOn', 'invalid_value');
  }
  return {
    id: decodeExactString(row, 'id', 'add-record', context),
    direction: decodeEnum(row, 'direction', LOAN_DIRECTIONS, context),
    kind: decodeEnum(row, 'kind', ASSET_KINDS, context),
    personName: decodeString(row, 'personName', context),
    personId: decodeNullableString(row, 'personId', context),
    itemName: decodeString(row, 'itemName', context),
    amount: decodeString(row, 'amount', context),
    currency: decodeCurrency(row, 'currency', context),
    dueOn,
    note: decodeString(row, 'note', context),
    updatedAt: decodeInstant(row, 'updatedAt', context),
  };
}
