import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { PersonPage } from './person-page';

function loan(id: string, overrides: Partial<Loan> = {}): Loan {
  return {
    id,
    direction: 'lent',
    assetKind: 'physical_item',
    status: 'active',
    personId: 'p1',
    personNameSnapshot: 'Andrei',
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
    ...overrides,
  };
}

describe('PersonPage', () => {
  it('answers the four relationship questions and separates active directions from history', async () => {
    const lent = loan('lent-drill');
    const borrowed = loan('borrowed-ladder', {
      direction: 'borrowed',
      itemName: 'ladder',
    });
    const completed = loan('completed-book', {
      status: 'completed',
      itemName: 'book',
      returnedOn: '2026-08-10',
    });
    await TestBed.configureTestingModule({
      imports: [PersonPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'p1' }) } },
        },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            currentDay: signal('2026-08-20'),
            daysUntilDue: () => null,
            personOverview: async () => ({
              person: { id: 'p1', displayName: 'Andrei' },
              active: [lent, borrowed],
              activeLent: [lent],
              activeBorrowed: [borrowed],
              history: [completed],
              lentItemCount: 1,
              borrowedItemCount: 1,
              owedToMe: [{ currencyCode: 'EUR', minorUnits: 5000n }],
              iOwe: [{ currencyCode: 'GBP', minorUnits: 2000n }],
              remainingByLoan: new Map(),
            }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toContain('Andrei');
    expect(root.querySelector('[data-summary="mine-with-them"]')?.textContent).toContain('1 item');
    expect(root.querySelector('[data-summary="theirs-with-me"]')?.textContent).toContain('1 item');
    expect(root.querySelector('[data-summary="they-owe-me"]')?.textContent).toContain('€50');
    expect(root.querySelector('[data-summary="i-owe-them"]')?.textContent).toContain('£20');
    expect(root.querySelector('.person-active-lent')?.textContent).toContain('drill');
    expect(root.querySelector('.person-active-borrowed')?.textContent).toContain('ladder');
    expect(root.querySelector('.person-history')?.textContent).toContain('book');
    expect(root.querySelector('a[href="/add?personId=p1"]')?.textContent).toContain(
      'Add record with Andrei',
    );
  });
});
