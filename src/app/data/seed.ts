import { addCalendarDays, todayInTimeZone, type CalendarDate } from '../domain/calendar-date';
import type { DomainClock } from '../domain/commands';
import type { CurrencyCode } from '../domain/money';
import type { Loan } from '../domain/types';
import type { BorrowedApp, CreateRecordInput } from './borrowed-app';

const PEOPLE = [
  'Peter',
  'Anna',
  'Maya',
  'Jonas',
  'Tomas',
  'Mom',
  'Laura',
  'Darius',
  'Eglė',
  'Mantas',
  'Rūta',
  'Andrei',
  'Sofia',
  'Lukas',
  'Greta',
  'Paulius',
  'Ieva',
  'Mark',
  'Nina',
  'Daniel',
  'Viktor',
  'Aistė',
  'Robert',
  'Elena',
] as const;

const ITEMS = [
  'Cordless drill',
  'Ladder',
  'Le Guin paperback',
  'Pressure washer',
  'HDMI cable',
  'Bike pump',
  'Camping chair',
  'Toolbox',
  'Projector',
  'Roof box',
  'Sewing machine',
  'Angle grinder',
  'Folding table',
  'Socket set',
  'Tent',
  'Car jack',
  'Paint sprayer',
  'Garden trimmer',
  'Portable speaker',
  'Board game',
  'Coffee grinder',
  'Extension reel',
  'Hand truck',
  'Steam cleaner',
] as const;

const NOTES = [
  'For the weekend project.',
  'Return after the renovation.',
  'Kept with the original case.',
  'Pickup arranged in the evening.',
  'No rush, but keep the due date visible.',
  'Includes the charger and cable.',
] as const;

const MONEY_AMOUNTS = [40, 60, 80, 100, 120, 160, 200, 240, 300] as const;
const CURRENCIES: readonly CurrencyCode[] = ['EUR', 'USD', 'GBP'];

function dueDate(index: number, today: CalendarDate): CalendarDate | null {
  switch (index % 5) {
    case 0:
      return addCalendarDays(today, -((index % 11) + 1));
    case 1:
      return addCalendarDays(today, (index % 3) + 1);
    case 2:
      return addCalendarDays(today, (index % 14) + 7);
    case 3:
      return null;
    default:
      return today;
  }
}

function isPhysical(index: number): boolean {
  return index % 4 === 0 || index % 4 === 3;
}

function shouldCompletePhysical(index: number): boolean {
  return index === 3 || (index >= 12 && index % 3 === 0 && index !== 87);
}

function shouldCompleteMoney(index: number): boolean {
  return index < 96 && (index % 6 === 1 || index % 6 === 2);
}

async function addMoneyHistory(
  app: BorrowedApp,
  loan: Loan,
  index: number,
  amount: number,
): Promise<void> {
  if (shouldCompleteMoney(index)) {
    await app.repay(loan.id, String(amount / 4), loan.currencyCode ?? undefined);
    await app.repay(loan.id, String((amount * 3) / 4), loan.currencyCode ?? undefined);
    return;
  }
  if (index % 5 === 1) {
    await app.repay(loan.id, String(amount / 4), loan.currencyCode ?? undefined);
    await app.repay(loan.id, String(amount / 4), loan.currencyCode ?? undefined);
    return;
  }
  if (index % 5 === 2) {
    await app.repay(loan.id, String(amount / 2), loan.currencyCode ?? undefined);
  }
}

export async function seedDemoIfEmpty(app: BorrowedApp, clock: DomainClock): Promise<void> {
  const [lent, borrowed, history] = await Promise.all([
    app.activeLoans('lent'),
    app.activeLoans('borrowed'),
    app.history(),
  ]);
  if (lent.length + borrowed.length + history.length > 0) {
    return;
  }

  const today = todayInTimeZone(clock.now(), clock.timeZone());
  const personIds = new Map<string, string>();

  for (let index = 0; index < 100; index += 1) {
    const personName = PEOPLE[index % PEOPLE.length];
    const physical = isPhysical(index);
    const amount = MONEY_AMOUNTS[index % MONEY_AMOUNTS.length];
    const dueOn = dueDate(index, today);
    const input: CreateRecordInput = {
      direction: Math.floor(index / PEOPLE.length) % 2 === 0 ? 'lent' : 'borrowed',
      kind: physical ? 'physical_item' : 'money',
      personName,
      personId: personIds.get(personName),
      occurredOn: addCalendarDays(today, -((index % 32) + 15)),
      dueOn,
      note: NOTES[index % NOTES.length],
      ...(physical
        ? {
            itemName: ITEMS[index % ITEMS.length],
            quantity: index % 9 === 0 ? (index % 3) + 2 : 1,
          }
        : {
            amount: String(amount),
            currency: CURRENCIES[Math.floor(index / 4) % CURRENCIES.length],
          }),
    };

    const loan = await app.createRecord(input);
    personIds.set(personName, loan.personId);

    if (dueOn && index > 0 && index % 13 === 0) {
      await app.changeDueDate(loan.id, addCalendarDays(dueOn, 2));
    }
    if (physical && shouldCompletePhysical(index)) {
      await app.markReturned(loan.id);
    } else if (!physical) {
      await addMoneyHistory(app, loan, index, amount);
    }
  }
}
