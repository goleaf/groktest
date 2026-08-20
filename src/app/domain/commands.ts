import type { CalendarDate } from './calendar-date';
import { instantFrom, requireCalendarDate, todayInTimeZone } from './calendar-date';
import { DomainError } from './errors';
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

export function buildPerson(displayName: string, clock: DomainClock, id: string = createId()): Person {
    const name = trimName(displayName);
    if (!name) {
        throw new DomainError('person_name_required');
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
        summaryKey: isMoney ? 'history.moneyCreated' : 'history.itemCreated',
        summaryParams: {
            person: loan.personNameSnapshot,
            item: loan.itemName ?? '',
            amount: loan.originalMinorUnits?.toString() ?? '',
            currency: loan.currencyCode ?? '',
            direction: loan.direction,
        },
        occurredAt: at,
        createdAt: at,
    };
}

export function createLoan(input: CreateLoanInput, clock: DomainClock): { loan: Loan; event: LoanEvent } {
    if (input.direction !== 'lent' && input.direction !== 'borrowed') {
        throw new DomainError('invalid_direction');
    }
    const personName = trimName(input.personName);
    if (!personName) {
        throw new DomainError('person_name_required');
    }
    const occurredOn = requireCalendarDate(input.occurredOn ?? today(clock));
    const dueOn = input.dueOn ? requireCalendarDate(input.dueOn) : null;
    const note = input.note?.trim() ? input.note.trim() : null;
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
        const quantity = input.quantity ?? 1;
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new DomainError('quantity_invalid');
        }
        loan = {
            ...base,
            assetKind: 'physical_item',
            itemName,
            itemDescription: input.itemDescription?.trim() || null,
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

export function markItemReturned(
    loan: Loan,
    clock: DomainClock,
): { loan: Loan; event: LoanEvent } {
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
    const repayment: Repayment = {
        id: createId(),
        loanId: loan.id,
        minorUnits,
        currencyCode: currency,
        occurredOn: requireCalendarDate(input.occurredOn ?? today(clock)),
        note: input.note?.trim() ? input.note.trim() : null,
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
