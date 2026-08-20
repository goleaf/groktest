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
  actions: [
    {
      loanId: 'drill',
      direction: 'lent',
      assetKind: 'physical_item',
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
      urgency: 'open',
      dueOn: null,
      daysUntilDue: null,
      messageKey: 'home.action.borrowedItem',
      params: { person: 'Anna', item: 'ladder' },
    },
  ] as unknown as HomeSummary['actions'],
};

describe('HomePage', () => {
  it('turns the lead physical record into an actionable custody tag', async () => {
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
    expect(root.querySelector('.page-header h1')?.textContent).toContain('Today');
    expect(root.querySelector('.attention-band')?.textContent).toContain('cordless drill');
    expect(root.querySelector('.attention-band')?.textContent).toContain('Overdue by 2 days');
    expect(root.querySelector('.record-count')?.textContent).toContain('8 open records');
    expect(root.querySelector('.lead-inline-action')?.textContent).toContain('Mark returned');
    expect(root.querySelector('.open-list')?.textContent).toContain('bike pump');
    expect(root.querySelector('.open-list')?.textContent).toContain('Overdue by 5 days');
    expect(root.querySelector('.open-list')?.textContent).toContain('ladder');

    (root.querySelector('.lead-inline-action') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(markReturned).toHaveBeenCalledWith('drill');
  });

  it('does not repeat an ordinary lead in the open-loans list', async () => {
    const ordinarySummary: HomeSummary = {
      activeLentCount: 1,
      activeBorrowedCount: 1,
      overdueCount: 0,
      dueSoonCount: 0,
      moneyOwedToMe: [],
      moneyIOwe: [],
      actions: [
        {
          loanId: 'ladder',
          direction: 'borrowed',
          assetKind: 'physical_item',
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
          urgency: 'open',
          dueOn: null,
          daysUntilDue: null,
          messageKey: 'home.action.lentItem',
          params: { person: 'Maya', item: 'book' },
        },
      ] as unknown as HomeSummary['actions'],
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

    expect(root.querySelector('.attention-band')).toBeTruthy();
    expect(ladderLinks).toHaveLength(1);
    expect(root.querySelector('.attention-band')?.textContent).toContain('ladder');
    expect(root.querySelector('.open-list')?.textContent).toContain('book');
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
});
