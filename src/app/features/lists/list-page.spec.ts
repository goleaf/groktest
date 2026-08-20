import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
