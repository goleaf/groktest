import { Inject, Injectable } from '@angular/core';
import {
  addRepayment,
  buildPerson,
  changeLoanDueDate,
  createLoan,
  markItemReturned,
  type CreateLoanInput,
  type DomainClock,
} from '../domain/commands';
import { DomainError } from '../domain/errors';
import type { Loan, Person } from '../domain/types';
import { CLOCK } from '../data/clock';
import { BorrowedStore } from '../data/store';

export interface CreateRecordInput {
  direction: CreateLoanInput['direction'];
  kind: CreateLoanInput['kind'];
  personName: string;
  personId?: string;
  itemName?: string;
  quantity?: number;
  amount?: string;
  currency?: string;
  occurredOn?: string;
  dueOn?: string | null;
  note?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RecordsCommandService {
  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
  ) {}

  async createRecord(input: CreateRecordInput): Promise<Loan> {
    let person: Person | undefined;
    if (input.personId) {
      person = await this.store.findPersonById(input.personId);
      if (!person) {
        throw new DomainError('person_missing');
      }
    }
    if (!person) {
      person = buildPerson(input.personName, this.clock);
    }
    const settings = await this.store.getSettings();
    const { loan, event } = createLoan(
      {
        direction: input.direction,
        kind: input.kind,
        personId: person.id,
        personName: person.displayName,
        itemName: input.itemName,
        quantity: input.quantity,
        amount: input.amount,
        currency: input.currency ?? settings.preferredCurrency,
        occurredOn: input.occurredOn,
        dueOn: input.dueOn,
        note: input.note,
      },
      this.clock,
    );
    await this.store.putLoanBundle({ person, loan, event, clock: this.clock });
    return loan;
  }

  markReturned(loanId: string): Promise<Loan> {
    return this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current) => markItemReturned(current, this.clock),
    });
  }

  changeDueDate(loanId: string, dueOn: string): Promise<Loan> {
    return this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current) => changeLoanDueDate(current, dueOn, this.clock),
    });
  }

  addRepayment(loanId: string, amount: string, currency?: string): Promise<Loan> {
    return this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current, repayments) =>
        addRepayment(
          current,
          repayments,
          { amount, currency: currency ?? current.currencyCode ?? 'EUR' },
          this.clock,
        ),
    });
  }
}
