import { addCalendarDays, todayInTimeZone } from '../domain/calendar-date';
import type { DomainClock } from '../domain/commands';
import type { BorrowedApp, CreateRecordInput } from './borrowed-app';

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
  const add = (input: CreateRecordInput) => app.createRecord(input);

  const drill = await add({
    direction: 'lent',
    kind: 'physical_item',
    personName: 'Peter',
    itemName: 'cordless drill',
    occurredOn: addCalendarDays(today, -10),
    dueOn: addCalendarDays(today, -2),
    note: 'For the kitchen shelves.',
  });
  void drill;

  await add({
    direction: 'borrowed',
    kind: 'physical_item',
    personName: 'Anna',
    itemName: 'ladder',
    dueOn: addCalendarDays(today, 1),
  });

  const cash = await add({
    direction: 'lent',
    kind: 'money',
    personName: 'Peter',
    amount: '50',
    currency: 'EUR',
    dueOn: addCalendarDays(today, 5),
  });
  await app.repay(cash.id, '20', 'EUR');

  await add({
    direction: 'borrowed',
    kind: 'money',
    personName: 'Mom',
    amount: '40',
    currency: 'EUR',
  });

  await add({
    direction: 'lent',
    kind: 'physical_item',
    personName: 'Maya',
    itemName: 'Le Guin paperback',
    note: 'The Left Hand of Darkness.',
  });

  await add({
    direction: 'borrowed',
    kind: 'physical_item',
    personName: 'Jonas',
    itemName: 'pressure washer',
    dueOn: addCalendarDays(today, 4),
  });

  const cable = await add({
    direction: 'lent',
    kind: 'physical_item',
    personName: 'Tomas',
    itemName: 'HDMI cable',
  });
  await app.markReturned(cable.id);

  await add({
    direction: 'borrowed',
    kind: 'physical_item',
    personName: 'Maya',
    itemName: 'bike pump',
    occurredOn: addCalendarDays(today, -10),
    dueOn: addCalendarDays(today, -5),
  });

  await add({
    direction: 'lent',
    kind: 'money',
    personName: 'Anna',
    amount: '15',
    currency: 'EUR',
  });
}
