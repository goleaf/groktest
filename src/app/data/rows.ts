import type { CalendarDate, Instant } from '../domain/calendar-date';
import type { CurrencyCode } from '../domain/money';
import type {
  AssetKind,
  LoanDirection,
  LoanEventType,
  StoredLoanStatus,
  SupportedLanguage,
  SyncEntityType,
} from '../domain/types';
import type { RecordDraft } from '../domain/types';

export interface PersonRow {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Instant;
  updatedAt: Instant;
  version: number;
  deletedAt: Instant | null;
}

export interface LoanRow {
  id: string;
  direction: LoanDirection;
  assetKind: AssetKind;
  status: StoredLoanStatus;
  personId: string;
  personNameSnapshot: string;
  occurredOn: CalendarDate;
  dueOn: CalendarDate | null;
  returnedOn: CalendarDate | null;
  note: string | null;
  itemName: string | null;
  itemDescription: string | null;
  quantity: number | null;
  currencyCode: CurrencyCode | null;
  originalMinorUnits: string | null;
  createdAt: Instant;
  updatedAt: Instant;
  version: number;
  deletedAt: Instant | null;
}

export interface RepaymentRow {
  id: string;
  loanId: string;
  minorUnits: string;
  currencyCode: CurrencyCode;
  occurredOn: CalendarDate;
  note: string | null;
  createdAt: Instant;
  version: number;
  deletedAt: Instant | null;
}

export interface LoanEventRow {
  id: string;
  loanId: string;
  type: LoanEventType;
  summaryKey: string;
  summaryParamsJson: string;
  occurredAt: Instant;
  createdAt: Instant;
}

export interface SettingsRow {
  id: 'local';
  localIdentityId: string;
  preferredCurrency: CurrencyCode;
  preferredLanguage: SupportedLanguage;
  schemaVersion: number;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
}

export type RecordDraftRow = RecordDraft;

export interface MutationRow {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'upsert' | 'delete';
  payloadJson: string;
  createdAt: Instant;
  ackedAt: Instant | null;
  attempts: number;
  lastError: string | null;
}
