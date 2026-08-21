import { describe, expect, it } from 'vitest';
import {
  addRepayment,
  buildPerson,
  changeLoanDueDate,
  createLoan,
  markItemReturned,
  type DomainClock,
} from './commands';
import { DomainError } from './errors';
import { isId } from './ids';
import { outstandingMinorUnits } from './loan-rules';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T15:00:00.000Z'),
  timeZone: () => 'Europe/Vilnius',
};

describe('create physical loans', () => {
  it('creates a lent item that stays active', () => {
    const { loan, event } = createLoan(
      {
        kind: 'physical_item',
        direction: 'lent',
        personId: 'person-1',
        personName: 'Peter',
        itemName: 'drill',
      },
      clock,
    );
    expect(loan.direction).toBe('lent');
    expect(loan.assetKind).toBe('physical_item');
    expect(loan.status).toBe('active');
    expect(loan.itemName).toBe('drill');
    expect(loan.quantity).toBe(1);
    expect(loan.occurredOn).toBe('2026-08-20');
    expect(loan.dueOn).toBeNull();
    expect(isId(loan.id)).toBe(true);
    expect(event.type).toBe('loan_created');
  });

  it('creates a borrowed item', () => {
    const { loan } = createLoan(
      {
        kind: 'physical_item',
        direction: 'borrowed',
        personId: 'person-2',
        personName: 'Anna',
        itemName: 'ladder',
        dueOn: '2026-08-27',
      },
      clock,
    );
    expect(loan.direction).toBe('borrowed');
    expect(loan.itemName).toBe('ladder');
    expect(loan.dueOn).toBe('2026-08-27');
  });

  it('requires an item name and a positive integer quantity', () => {
    expect(() =>
      createLoan(
        {
          kind: 'physical_item',
          direction: 'lent',
          personId: 'p',
          personName: 'P',
          itemName: '  ',
        },
        clock,
      ),
    ).toThrow(DomainError);
    expect(() =>
      createLoan(
        {
          kind: 'physical_item',
          direction: 'lent',
          personId: 'p',
          personName: 'P',
          itemName: 'drill',
          quantity: 0,
        },
        clock,
      ),
    ).toThrow(DomainError);
  });

  it('rejects oversized names, notes, descriptions, and quantities', () => {
    expect(() => buildPerson('P'.repeat(121), clock)).toThrow(DomainError);
    expect(() =>
      createLoan(
        {
          kind: 'physical_item',
          direction: 'lent',
          personId: 'p',
          personName: 'Peter',
          itemName: 'D'.repeat(201),
        },
        clock,
      ),
    ).toThrow(DomainError);
    expect(() =>
      createLoan(
        {
          kind: 'physical_item',
          direction: 'lent',
          personId: 'p',
          personName: 'Peter',
          itemName: 'drill',
          itemDescription: 'D'.repeat(2001),
          note: 'N'.repeat(4001),
        },
        clock,
      ),
    ).toThrow(DomainError);
    expect(() =>
      createLoan(
        {
          kind: 'physical_item',
          direction: 'lent',
          personId: 'p',
          personName: 'Peter',
          itemName: 'drill',
          quantity: 1_000_001,
        },
        clock,
      ),
    ).toThrow(DomainError);
  });

  it('does not accept a due date before the handoff date', () => {
    expect(() =>
      createLoan(
        {
          kind: 'physical_item',
          direction: 'borrowed',
          personId: 'p',
          personName: 'Peter',
          itemName: 'drill',
          occurredOn: '2026-08-20',
          dueOn: '2026-08-19',
        },
        clock,
      ),
    ).toThrow(DomainError);
  });
});

describe('create money loans', () => {
  it('creates lent money without rewriting the original amount later', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        amount: '50',
        currency: 'EUR',
      },
      clock,
    );
    expect(loan.originalMinorUnits).toBe(5000n);
    expect(loan.currencyCode).toBe('EUR');
    expect(loan.assetKind).toBe('money');
  });

  it('creates borrowed money', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'borrowed',
        personId: 'p',
        personName: 'Anna',
        amount: '20.00',
        currency: 'EUR',
      },
      clock,
    );
    expect(loan.direction).toBe('borrowed');
    expect(loan.originalMinorUnits).toBe(2000n);
  });

  it('rejects bad amounts and currencies', () => {
    expect(() =>
      createLoan(
        {
          kind: 'money',
          direction: 'lent',
          personId: 'p',
          personName: 'P',
          amount: '0',
          currency: 'EUR',
        },
        clock,
      ),
    ).toThrow(DomainError);
    expect(() =>
      createLoan(
        {
          kind: 'money',
          direction: 'lent',
          personId: 'p',
          personName: 'P',
          amount: '10',
          currency: 'XXX',
        },
        clock,
      ),
    ).toThrow(DomainError);
  });
});

describe('people', () => {
  it('requires a display name and nothing else', () => {
    const person = buildPerson('  Mom  ', clock);
    expect(person.displayName).toBe('Mom');
    expect(person.phone).toBeNull();
    expect(isId(person.id)).toBe(true);
    expect(() => buildPerson('   ', clock)).toThrow(DomainError);
  });
});

describe('return and repayment', () => {
  it('marks a physical loan completed without deleting it', () => {
    const { loan } = createLoan(
      {
        kind: 'physical_item',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        itemName: 'drill',
      },
      clock,
    );
    const result = markItemReturned(loan, clock);
    expect(result.loan.status).toBe('completed');
    expect(result.loan.id).toBe(loan.id);
    expect(result.loan.returnedOn).toBe('2026-08-20');
    expect(result.event.type).toBe('item_returned');
    expect(loan.status).toBe('active');
  });

  it('rejects returning an item before its handoff date', () => {
    const { loan } = createLoan(
      {
        kind: 'physical_item',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        itemName: 'drill',
        occurredOn: '2026-08-21',
      },
      clock,
    );

    expect(() => markItemReturned(loan, clock)).toThrowError('date_order_invalid');
  });

  it('adds partial repayments and computes remaining from history', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        amount: '500',
        currency: 'EUR',
      },
      clock,
    );
    const first = addRepayment(loan, [], { amount: '100', currency: 'EUR' }, clock);
    expect(first.loan.status).toBe('active');
    expect(outstandingMinorUnits(first.loan, [first.repayment])).toBe(40000n);
    expect(first.loan.originalMinorUnits).toBe(50000n);

    const second = addRepayment(
      first.loan,
      [first.repayment],
      { amount: '50', currency: 'EUR' },
      clock,
    );
    expect(outstandingMinorUnits(second.loan, [first.repayment, second.repayment])).toBe(35000n);
    expect(second.loan.status).toBe('active');
  });

  it('completes a money loan when repayments equal the original', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        amount: '40',
        currency: 'EUR',
      },
      clock,
    );
    const result = addRepayment(loan, [], { amount: '40', currency: 'EUR' }, clock);
    expect(result.loan.status).toBe('completed');
    expect(outstandingMinorUnits(result.loan, [result.repayment])).toBe(0n);
  });

  it('prevents over-repayment', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        amount: '40',
        currency: 'EUR',
      },
      clock,
    );
    const first = addRepayment(loan, [], { amount: '30', currency: 'EUR' }, clock);
    expect(() =>
      addRepayment(first.loan, [first.repayment], { amount: '20', currency: 'EUR' }, clock),
    ).toThrow(DomainError);
  });

  it('rejects a repayment dated before the original handoff', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'lent',
        personId: 'p',
        personName: 'Peter',
        amount: '40',
        currency: 'EUR',
        occurredOn: '2026-08-20',
      },
      clock,
    );
    expect(() =>
      addRepayment(loan, [], { amount: '10', currency: 'EUR', occurredOn: '2026-08-19' }, clock),
    ).toThrow(DomainError);
  });
});

describe('due-date changes', () => {
  it('moves an active deadline and appends a meaningful activity event', () => {
    const { loan } = createLoan(
      {
        kind: 'money',
        direction: 'lent',
        personId: 'p',
        personName: 'Sergey',
        amount: '200',
        currency: 'EUR',
        occurredOn: '2026-08-20',
        dueOn: '2026-09-01',
      },
      clock,
    );

    const result = changeLoanDueDate(loan, '2026-09-05', clock);

    expect(result.loan.dueOn).toBe('2026-09-05');
    expect(result.loan.status).toBe('active');
    expect(result.loan.version).toBe(loan.version + 1);
    expect(result.event.type).toBe('due_date_changed');
    expect(result.event.summaryKey).toBe('history.dueDateChanged');
    expect(result.event.summaryParams).toEqual({ date: '2026-09-05' });
  });

  it('rejects a deadline before the handoff and changes to inactive records', () => {
    const { loan } = createLoan(
      {
        kind: 'physical_item',
        direction: 'lent',
        personId: 'p',
        personName: 'Sergey',
        itemName: 'drill',
        occurredOn: '2026-08-20',
        dueOn: '2026-08-25',
      },
      clock,
    );

    expect(() => changeLoanDueDate(loan, '2026-08-19', clock)).toThrow(DomainError);
    expect(() => changeLoanDueDate(loan, '2026-08-25', clock)).toThrowError('due_date_unchanged');
    const completed = markItemReturned(loan, clock).loan;
    expect(() => changeLoanDueDate(completed, '2026-08-25', clock)).toThrow(DomainError);
  });
});
