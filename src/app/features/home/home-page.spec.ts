import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BorrowedApp } from '../../data/borrowed-app';
import type { HomeSummary } from '../../domain/types';
import { HomePage } from './home-page';

const summary: HomeSummary = {
  activeLentCount: 4,
  activeBorrowedCount: 4,
  overdueCount: 2,
  dueSoonCount: 1,
  moneyOwedToMe: [{ currencyCode: 'EUR', minorUnits: 4500n }],
  moneyIOwe: [{ currencyCode: 'EUR', minorUnits: 4000n }],
  recentPeople: [
    {
      personId: 'p1',
      personName: 'Peter',
      activeCount: 3,
      lentCount: 2,
      borrowedCount: 1,
    },
    {
      personId: 'p2',
      personName: 'Maya',
      activeCount: 2,
      lentCount: 0,
      borrowedCount: 2,
    },
  ],
  actions: [
    {
      loanId: 'drill',
      direction: 'lent',
      assetKind: 'physical_item',
      personName: 'Peter',
      subject: 'cordless drill',
      urgency: 'overdue',
      dueOn: '2026-08-18',
      daysUntilDue: -2,
      messageKey: 'home.action.lentItemOverdue',
      params: { person: 'Peter', item: 'cordless drill' },
    },
    {
      loanId: 'pump',
      direction: 'borrowed',
      assetKind: 'physical_item',
      personName: 'Maya',
      subject: 'bike pump',
      urgency: 'overdue',
      dueOn: '2026-08-15',
      daysUntilDue: -5,
      messageKey: 'home.action.borrowedItemOverdue',
      params: { person: 'Maya', item: 'bike pump' },
    },
    {
      loanId: 'ladder',
      direction: 'borrowed',
      assetKind: 'physical_item',
      personName: 'Anna',
      subject: 'ladder',
      urgency: 'open',
      dueOn: null,
      daysUntilDue: null,
      messageKey: 'home.action.borrowedItem',
      params: { person: 'Anna', item: 'ladder' },
    },
  ],
  dueNext: [
    {
      loanId: 'camera',
      direction: 'lent',
      assetKind: 'physical_item',
      personName: 'Sergey',
      subject: 'camera',
      urgency: 'open',
      dueOn: '2026-08-25',
      daysUntilDue: 5,
      messageKey: 'home.action.lentItem',
      params: { person: 'Sergey', item: 'camera' },
    },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('HomePage', () => {
  it('renders a connected overview, handoff ledger, due rail, and related people', async () => {
    const markReturned = vi.fn(async () => undefined);
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            currentDay: signal('2026-08-20'),
            home: async () => summary,
            markReturned,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.page-header h1')?.textContent).toContain('Overview');
    expect(root.querySelectorAll('.overview-stat')).toHaveLength(4);
    expect(root.querySelector('.record-count')?.textContent).toContain('8 open records');
    expect(root.querySelector('.home-ledger')?.textContent).toContain('cordless drill');
    expect(root.querySelector('.home-ledger')?.textContent).toContain('Overdue by 2 days');
    expect(root.querySelector('.home-ledger')?.textContent).toContain('bike pump');
    expect(root.querySelectorAll('.home-ledger app-handoff-line')).toHaveLength(3);
    expect(root.querySelector('.due-rail')?.textContent).toContain('camera');
    expect(root.querySelector('.due-rail')?.textContent).not.toContain('bike pump');
    expect(root.querySelector('.people-rail')?.textContent).toContain('Peter');
    expect(root.querySelector('.ledger-return-action')?.textContent).toContain('Mark returned');

    (root.querySelector('.ledger-return-action') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(markReturned).toHaveBeenCalledWith('drill');
  });

  it('renders every ordinary open handoff exactly once in the ledger', async () => {
    const ordinarySummary: HomeSummary = {
      activeLentCount: 1,
      activeBorrowedCount: 1,
      overdueCount: 0,
      dueSoonCount: 0,
      moneyOwedToMe: [],
      moneyIOwe: [],
      recentPeople: [],
      actions: [
        {
          loanId: 'ladder',
          direction: 'borrowed',
          assetKind: 'physical_item',
          personName: 'Anna',
          subject: 'ladder',
          urgency: 'open',
          dueOn: null,
          daysUntilDue: null,
          messageKey: 'home.action.borrowedItem',
          params: { person: 'Anna', item: 'ladder' },
        },
        {
          loanId: 'book',
          direction: 'lent',
          assetKind: 'physical_item',
          personName: 'Maya',
          subject: 'book',
          urgency: 'open',
          dueOn: null,
          daysUntilDue: null,
          messageKey: 'home.action.lentItem',
          params: { person: 'Maya', item: 'book' },
        },
      ],
      dueNext: [],
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            currentDay: signal('2026-08-20'),
            home: async () => ordinarySummary,
            markReturned: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const ladderLinks = root.querySelectorAll('a[href="/loans/ladder"]');

    expect(ladderLinks).toHaveLength(1);
    expect(root.querySelector('.home-ledger')?.textContent).toContain('ladder');
    expect(root.querySelector('.home-ledger')?.textContent).toContain('book');
  });

  it('refreshes its reminder summary when the local calendar day changes', async () => {
    const currentDay = signal('2026-08-20');
    const home = vi.fn(async () => summary);
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            currentDay,
            home,
            markReturned: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(home).toHaveBeenCalledTimes(1);

    currentDay.set('2026-08-21');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(home).toHaveBeenCalledTimes(2);
  });

  it('does not let an older summary replace a newer revision', async () => {
    const revision = signal(0);
    const older = deferred<HomeSummary>();
    const newer = deferred<HomeSummary>();
    const home = vi
      .fn<() => Promise<HomeSummary>>()
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => newer.promise);

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision,
            currentDay: signal('2026-08-20'),
            home,
            markReturned: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(home).toHaveBeenCalledTimes(1));
    revision.set(1);
    fixture.detectChanges();
    await vi.waitFor(() => expect(home).toHaveBeenCalledTimes(2));

    newer.resolve({ ...summary, activeLentCount: 9 });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('13 open records');
    });
    older.resolve(summary);
    await Promise.resolve();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('13 open records');
  });
});
