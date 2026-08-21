import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { ListPage } from './list-page';

const loan: Loan = {
  id: '01900000-0000-7000-8000-000000000001',
  direction: 'lent',
  assetKind: 'physical_item',
  status: 'active',
  personId: 'p1',
  personNameSnapshot: 'Peter',
  occurredOn: '2026-08-01',
  dueOn: null,
  returnedOn: null,
  note: null,
  itemName: 'drill',
  itemDescription: null,
  quantity: 1,
  currencyCode: null,
  originalMinorUnits: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
  version: 1,
  deletedAt: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('ListPage filters', () => {
  it('uses pressed buttons in a labelled group instead of incomplete tab semantics', async () => {
    await TestBed.configureTestingModule({
      imports: [ListPage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            activeLoans: async () => [loan],
            remainingMap: async () => new Map(),
            filterLoans: (loans: readonly Loan[]) => [...loans],
            isOverdue: () => false,
            isDueSoon: () => false,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ListPage);
    fixture.componentRef.setInput('direction', 'lent');
    fixture.componentRef.setInput('titleKey', 'lent.title');
    fixture.componentRef.setInput('emptyKey', 'lent.empty');
    fixture.componentRef.setInput('emptyActionKey', 'lent.emptyAction');
    fixture.componentRef.setInput('icon', 'lent');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const group = root.querySelector('[role="group"][aria-label="Filter loans"]');
    const buttons = group?.querySelectorAll('button') ?? [];

    expect(group).toBeTruthy();
    expect(buttons).toHaveLength(5);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
    expect(root.querySelector('.results-bar')?.textContent).toContain('1 record shown');
    expect(root.querySelector('.ledger-columns')?.textContent).toContain('Handoff');
    expect(root.querySelector('.ledger-columns')?.textContent).toContain('Asset / amount');
  });

  it('offers an all, lent, and borrowed scope on the records destination', async () => {
    const directions: ('lent' | 'borrowed' | undefined)[] = [];

    await TestBed.configureTestingModule({
      imports: [ListPage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            activeLoans: async (direction?: 'lent' | 'borrowed') => {
              directions.push(direction);
              return [loan];
            },
            remainingMap: async () => new Map(),
            filterLoans: (loans: readonly Loan[]) => [...loans],
            isOverdue: () => false,
            isDueSoon: () => false,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ListPage);
    fixture.componentRef.setInput('direction', 'all');
    fixture.componentRef.setInput('titleKey', 'records.title');
    fixture.componentRef.setInput('emptyKey', 'records.empty');
    fixture.componentRef.setInput('emptyActionKey', 'records.emptyAction');
    fixture.componentRef.setInput('icon', 'records');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const group = root.querySelector('[role="group"][aria-label="Record direction"]');

    expect(group?.querySelectorAll('button')).toHaveLength(3);
    expect(group?.querySelector('button[aria-pressed="true"]')?.textContent).toContain('All');
    expect(directions).toContain(undefined);
  });

  it('stores scope, filter, and search in the URL and restores controls from history state', async () => {
    await TestBed.configureTestingModule({
      imports: [ListPage],
      providers: [
        provideRouter([{ path: 'records', component: ListPage }]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            activeLoans: async () => [loan],
            remainingMap: async () => new Map(),
            filterLoans: (loans: readonly Loan[]) => [...loans],
            isOverdue: () => false,
            isDueSoon: () => false,
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/records?campaign=local');

    const fixture = TestBed.createComponent(ListPage);
    fixture.componentRef.setInput('direction', 'all');
    fixture.componentRef.setInput('titleKey', 'records.title');
    fixture.componentRef.setInput('emptyKey', 'records.empty');
    fixture.componentRef.setInput('emptyActionKey', 'records.emptyAction');
    fixture.componentRef.setInput('icon', 'records');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const scopeButtons = root.querySelectorAll('.scope-switch button');
    (scopeButtons[2] as HTMLButtonElement).click();
    await vi.waitFor(() => expect(router.url).toBe('/records?campaign=local&scope=borrowed'));
    fixture.detectChanges();

    const filterButtons = root.querySelectorAll('.chips button');
    (filterButtons[3] as HTMLButtonElement).click();
    await vi.waitFor(() =>
      expect(router.url).toBe('/records?campaign=local&scope=borrowed&filter=overdue'),
    );
    fixture.detectChanges();

    const search = root.querySelector('input[type="search"]') as HTMLInputElement;
    const navigate = vi.spyOn(router, 'navigate');
    search.value = '  Peter   drill  ';
    search.dispatchEvent(new Event('input'));
    await vi.waitFor(() =>
      expect(router.url).toBe(
        '/records?campaign=local&scope=borrowed&filter=overdue&q=Peter%20drill',
      ),
    );
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ replaceUrl: true }));

    await router.navigateByUrl('/records?campaign=local&scope=borrowed&filter=overdue');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((root.querySelector('input[type="search"]') as HTMLInputElement).value).toBe('');
    expect(root.querySelector('.scope-switch button[aria-pressed="true"]')?.textContent).toContain(
      'Borrowed',
    );
    expect(root.querySelector('.chips button[aria-pressed="true"]')?.textContent).toContain(
      'Overdue',
    );
    expect(root.querySelector('.results-bar')?.getAttribute('role')).toBe('status');
    expect(root.querySelector('.results-bar')?.getAttribute('aria-live')).toBe('polite');
  });

  it('does not let a slower previous scope replace a newer result', async () => {
    const allResult = deferred<Loan[]>();
    const borrowedResult = deferred<Loan[]>();
    const directions: ('lent' | 'borrowed' | undefined)[] = [];
    const borrowedLoan = {
      ...loan,
      id: 'borrowed-ladder',
      direction: 'borrowed' as const,
      itemName: 'ladder',
    };

    await TestBed.configureTestingModule({
      imports: [ListPage],
      providers: [
        provideRouter([{ path: 'records', component: ListPage }]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            activeLoans: (direction?: 'lent' | 'borrowed') => {
              directions.push(direction);
              return direction === 'borrowed' ? borrowedResult.promise : allResult.promise;
            },
            remainingMap: async () => new Map(),
            filterLoans: (loans: readonly Loan[]) => [...loans],
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/records');
    const fixture = TestBed.createComponent(ListPage);
    fixture.componentRef.setInput('direction', 'all');
    fixture.componentRef.setInput('titleKey', 'records.title');
    fixture.componentRef.setInput('emptyKey', 'records.empty');
    fixture.componentRef.setInput('emptyActionKey', 'records.emptyAction');
    fixture.componentRef.setInput('icon', 'records');
    fixture.detectChanges();
    await vi.waitFor(() => expect(directions).toContain(undefined));

    const root = fixture.nativeElement as HTMLElement;
    (root.querySelectorAll('.scope-switch button')[2] as HTMLButtonElement).click();
    await vi.waitFor(() => expect(directions).toContain('borrowed'));

    borrowedResult.resolve([borrowedLoan]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('.loan-list')?.textContent).toContain('ladder');
    });
    allResult.resolve([loan]);
    await Promise.resolve();
    fixture.detectChanges();

    expect(root.querySelector('.loan-list')?.textContent).toContain('ladder');
    expect(root.querySelector('.loan-list')?.textContent).not.toContain('drill');
  });
});
