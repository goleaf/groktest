import type { CalendarDate, Instant } from './calendar-date';
import type { CurrencyCode } from './money';
import type { SupportedLanguage } from '../i18n/catalog';

export type { SupportedLanguage } from '../i18n/catalog';

export type LoanDirection = 'lent' | 'borrowed';
export type AssetKind = 'physical_item' | 'money';
export type StoredLoanStatus = 'active' | 'completed' | 'cancelled' | 'archived';
export type LoanEventType =
  | 'loan_created'
  | 'repayment_added'
  | 'item_returned'
  | 'due_date_changed'
  | 'note_changed'
  | 'loan_cancelled'
  | 'loan_archived'
  | 'loan_reopened';

export interface Person {
  readonly id: string;
  readonly displayName: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly notes: string | null;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
  readonly version: number;
  readonly deletedAt: Instant | null;
}

export interface Loan {
  readonly id: string;
  readonly direction: LoanDirection;
  readonly assetKind: AssetKind;
  readonly status: StoredLoanStatus;
  readonly personId: string;
  readonly personNameSnapshot: string;
  readonly occurredOn: CalendarDate;
  readonly dueOn: CalendarDate | null;
  readonly returnedOn: CalendarDate | null;
  readonly note: string | null;
  readonly itemName: string | null;
  readonly itemDescription: string | null;
  readonly quantity: number | null;
  readonly currencyCode: CurrencyCode | null;
  readonly originalMinorUnits: bigint | null;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
  readonly version: number;
  readonly deletedAt: Instant | null;
}

export interface Repayment {
  readonly id: string;
  readonly loanId: string;
  readonly minorUnits: bigint;
  readonly currencyCode: CurrencyCode;
  readonly occurredOn: CalendarDate;
  readonly note: string | null;
  readonly createdAt: Instant;
  readonly version: number;
  readonly deletedAt: Instant | null;
}

export interface LoanEvent {
  readonly id: string;
  readonly loanId: string;
  readonly type: LoanEventType;
  readonly summaryKey: string;
  readonly summaryParams: Readonly<Record<string, string>>;
  readonly occurredAt: Instant;
  readonly createdAt: Instant;
}

export interface LocalSettings {
  readonly id: 'local';
  readonly localIdentityId: string;
  readonly preferredCurrency: CurrencyCode;
  readonly preferredLanguage: SupportedLanguage;
  readonly schemaVersion: number;
  readonly version: number;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
}

export interface RecordDraft {
  readonly id: 'add-record';
  readonly direction: LoanDirection;
  readonly kind: AssetKind;
  readonly personName: string;
  readonly personId: string | null;
  readonly itemName: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly dueOn: string;
  readonly note: string;
  readonly updatedAt: Instant;
}

export type SyncEntityType = 'person' | 'loan' | 'repayment' | 'loan_event' | 'settings';

export interface SyncMutation {
  readonly id: string;
  readonly entityType: SyncEntityType;
  readonly entityId: string;
  readonly operation: 'upsert' | 'delete';
  readonly payloadJson: string;
  readonly createdAt: Instant;
  readonly ackedAt: Instant | null;
  readonly attempts: number;
  readonly lastError: string | null;
}

export interface MoneyTotal {
  readonly currencyCode: CurrencyCode;
  readonly minorUnits: bigint;
}

interface HomeActionBase {
  readonly loanId: string;
  readonly direction: LoanDirection;
  readonly personName: string;
  readonly urgency: 'overdue' | 'due_soon' | 'open';
  readonly dueOn: CalendarDate | null;
  readonly daysUntilDue: number | null;
}

export interface HomeItemAction extends HomeActionBase {
  readonly assetKind: 'physical_item';
  readonly itemName: string;
}

export interface HomeMoneyAction extends HomeActionBase {
  readonly assetKind: 'money';
  readonly money: MoneyTotal | null;
}

export type HomeAction = HomeItemAction | HomeMoneyAction;

export interface HomePersonSummary {
  readonly personId: string;
  readonly personName: string;
  readonly activeCount: number;
  readonly lentCount: number;
  readonly borrowedCount: number;
}

export interface HomeSummary {
  readonly activeLentCount: number;
  readonly activeBorrowedCount: number;
  readonly moneyOwedToMe: readonly MoneyTotal[];
  readonly moneyIOwe: readonly MoneyTotal[];
  readonly overdueCount: number;
  readonly dueSoonCount: number;
  readonly actions: readonly HomeAction[];
  readonly dueNext: readonly HomeAction[];
  readonly recentPeople: readonly HomePersonSummary[];
}
