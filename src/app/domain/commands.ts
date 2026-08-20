import type { CalendarDate } from './calendar-date';
import { instantFrom, requireCalendarDate, todayInTimeZone } from './calendar-date';
import { DomainError } from './errors';
import { INPUT_LIMITS } from './config';
import { createId } from './ids';
import { parseAmountToMinorUnits, requireCurrency } from './money';
import type { CurrencyCode } from './money';
import { assertCanRepay, isMoneyCompleted } from './loan-rules';
import type { Loan, LoanDirection, LoanEvent, Person, Repayment } from './types';

export interface CreateLoanInput {
  direction: LoanDirection;
  personId: string;
  personName: string;
  occurredOn?: string;
  dueOn?: string | null;
  note?: string | null;
  itemName?: string;
  itemDescription?: string | null;
  quantity?: number;
  amount?: string;
  currency?: string;
  kind: 'physical_item' | 'money';
}

export interface DomainClock {
  now(): Date;
  timeZone(): string;
}

function trimName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function optionalText(
  value: string | null | undefined,
  maximum: number,
  error: 'item_description_too_long' | 'note_too_long',
): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maximum) {
    throw new DomainError(error);
  }
  return trimmed;
}

export function buildPerson(
  displayName: string,
  clock: DomainClock,
  id: string = createId(),
): Person {
  const name = trimName(displayName);
  if (!name) {
    throw new DomainError('person_name_required');
  }
  if (name.length > INPUT_LIMITS.personName) {
    throw new DomainError('person_name_too_long');
  }
  const at = instantFrom(clock.now());
  return {
    id,
    displayName: name,
    phone: null,
    email: null,
    notes: null,
    createdAt: at,
    updatedAt: at,
    version: 1,
    deletedAt: null,
  };
}

function today(clock: DomainClock): CalendarDate {
  return todayInTimeZone(clock.now(), clock.timeZone());
}

function createdEvent(loan: Loan, clock: DomainClock): LoanEvent {
  const at = instantFrom(clock.now());
  const isMoney = loan.assetKind === 'money';
  return {
    id: createId(),
    loanId: loan.id,
    type: 'loan_created',
    summaryKey: isMoney
      ? loan.direction === 'lent'
        ? 'history.moneyCreatedLent'
        : 'history.moneyCreatedBorrowed'
      : loan.direction === 'lent'
        ? 'history.itemCreatedLent'
        : 'history.itemCreatedBorrowed',
    summaryParams: {
      person: loan.personNameSnapshot,
      item: loan.itemName ?? '',
      amount: loan.originalMinorUnits?.toString() ?? '',
      currency: loan.currencyCode ?? '',
    },
    occurredAt: at,
    createdAt: at,
  };
}

export function createLoan(
  input: CreateLoanInput,
  clock: DomainClock,
): { loan: Loan; event: LoanEvent } {
  if (input.direction !== 'lent' && input.direction !== 'borrowed') {
    throw new DomainError('invalid_direction');
  }
  const personName = trimName(input.personName);
  if (!personName) {
    throw new DomainError('person_name_required');
  }
  if (personName.length > INPUT_LIMITS.personName) {
    throw new DomainError('person_name_too_long');
  }
  const occurredOn = requireCalendarDate(input.occurredOn ?? today(clock));
  const dueOn = input.dueOn ? requireCalendarDate(input.dueOn) : null;
  if (dueOn && dueOn < occurredOn) {
    throw new DomainError('date_order_invalid');
  }
  const note = optionalText(input.note, INPUT_LIMITS.note, 'note_too_long');
  const at = instantFrom(clock.now());
  const base = {
    id: createId(),
    direction: input.direction,
    status: 'active' as const,
    personId: input.personId,
    personNameSnapshot: personName,
    occurredOn,
    dueOn,
    returnedOn: null,
    note,
    createdAt: at,
    updatedAt: at,
    version: 1,
    deletedAt: null,
  };

  let loan: Loan;
  if (input.kind === 'physical_item') {
    const itemName = trimName(input.itemName ?? '');
    if (!itemName) {
      throw new DomainError('item_name_required');
    }
    if (itemName.length > INPUT_LIMITS.itemName) {
      throw new DomainError('item_name_too_long');
    }
    const quantity = input.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > INPUT_LIMITS.quantity) {
      throw new DomainError('quantity_invalid');
    }
    loan = {
      ...base,
      assetKind: 'physical_item',
      itemName,
      itemDescription: optionalText(
        input.itemDescription,
        INPUT_LIMITS.itemDescription,
        'item_description_too_long',
      ),
      quantity,
      currencyCode: null,
      originalMinorUnits: null,
    };
  } else if (input.kind === 'money') {
    const currency = requireCurrency(input.currency ?? '');
    const originalMinorUnits = parseAmountToMinorUnits(input.amount ?? '', currency);
    loan = {
      ...base,
      assetKind: 'money',
      itemName: null,
      itemDescription: null,
      quantity: null,
      currencyCode: currency,
      originalMinorUnits,
    };
  } else {
    throw new DomainError('invalid_asset_kind');
  }

  return { loan, event: createdEvent(loan, clock) };
}

export function markItemReturned(loan: Loan, clock: DomainClock): { loan: Loan; event: LoanEvent } {
  if (loan.assetKind !== 'physical_item') {
    throw new DomainError('not_physical_loan');
  }
  if (loan.status !== 'active' || loan.deletedAt !== null) {
    throw new DomainError('loan_not_active');
  }
  const at = instantFrom(clock.now());
  const returnedOn = today(clock);
  const next: Loan = {
    ...loan,
    status: 'completed',
    returnedOn,
    updatedAt: at,
    version: loan.version + 1,
  };
  return {
    loan: next,
    event: {
      id: createId(),
      loanId: loan.id,
      type: 'item_returned',
      summaryKey: 'history.itemReturned',
      summaryParams: { item: loan.itemName ?? '', person: loan.personNameSnapshot },
      occurredAt: at,
      createdAt: at,
    },
  };
}

export function changeLoanDueDate(
  loan: Loan,
  dueOnInput: string,
  clock: DomainClock,
): { loan: Loan; event: LoanEvent } {
  if (loan.status !== 'active' || loan.deletedAt !== null) {
    throw new DomainError('loan_not_active');
  }
  const dueOn = requireCalendarDate(dueOnInput);
  if (dueOn < loan.occurredOn) {
    throw new DomainError('date_order_invalid');
  }
  if (dueOn === loan.dueOn) {
    throw new DomainError('due_date_unchanged');
  }
  const at = instantFrom(clock.now());
  return {
    loan: {
      ...loan,
      dueOn,
      updatedAt: at,
      version: loan.version + 1,
    },
    event: {
      id: createId(),
      loanId: loan.id,
      type: 'due_date_changed',
      summaryKey: 'history.dueDateChanged',
      summaryParams: { date: dueOn },
      occurredAt: at,
      createdAt: at,
    },
  };
}

export function addRepayment(
  loan: Loan,
  existing: readonly Repayment[],
  input: { amount: string; currency: string; occurredOn?: string; note?: string | null },
  clock: DomainClock,
): { repayment: Repayment; loan: Loan; event: LoanEvent } {
  const currency = requireCurrency(input.currency) as CurrencyCode;
  const minorUnits = parseAmountToMinorUnits(input.amount, currency);
  assertCanRepay(loan, existing, minorUnits, currency);
  const at = instantFrom(clock.now());
  const occurredOn = requireCalendarDate(input.occurredOn ?? today(clock));
  if (occurredOn < loan.occurredOn) {
    throw new DomainError('date_order_invalid');
  }
  const repayment: Repayment = {
    id: createId(),
    loanId: loan.id,
    minorUnits,
    currencyCode: currency,
    occurredOn,
    note: optionalText(input.note, INPUT_LIMITS.note, 'note_too_long'),
    createdAt: at,
    version: 1,
    deletedAt: null,
  };
  const all = [...existing, repayment];
  const completed = isMoneyCompleted(loan, all);
  const next: Loan = completed
    ? {
        ...loan,
        status: 'completed',
        returnedOn: repayment.occurredOn,
        updatedAt: at,
        version: loan.version + 1,
      }
    : {
        ...loan,
        updatedAt: at,
        version: loan.version + 1,
      };
  return {
    repayment,
    loan: next,
    event: {
      id: createId(),
      loanId: loan.id,
      type: 'repayment_added',
      summaryKey: completed ? 'history.moneyCompleted' : 'history.repaymentAdded',
      summaryParams: {
        amount: minorUnits.toString(),
        currency,
        person: loan.personNameSnapshot,
      },
      occurredAt: at,
      createdAt: at,
    },
  };
}
