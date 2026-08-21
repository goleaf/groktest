import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BorrowedApp } from '../../data/borrowed-app';
import type { LoanRecord } from '../../data/store';
import { DetailPage } from './detail-page';

const record: LoanRecord = {
  person: {
    id: 'peter',
    displayName: 'Peter',
    phone: null,
    email: null,
    notes: null,
    createdAt: '2026-08-12T10:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
    version: 1,
    deletedAt: null,
  },
  loan: {
    id: 'drill',
    direction: 'lent',
    assetKind: 'physical_item',
    status: 'active',
    personId: 'peter',
    personNameSnapshot: 'Peter',
    occurredOn: '2026-08-12',
    dueOn: '2026-08-18',
    returnedOn: null,
    note: 'For the hallway shelves',
    itemName: 'Cordless drill',
    itemDescription: null,
    quantity: 1,
    currencyCode: null,
    originalMinorUnits: null,
    createdAt: '2026-08-12T10:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
    version: 1,
    deletedAt: null,
  },
  repayments: [],
  events: [
    {
      id: 'event-1',
      loanId: 'drill',
      type: 'loan_created',
      summaryKey: 'history.itemCreatedLent',
      summaryParams: { item: 'Cordless drill', person: 'Peter' },
      occurredAt: '2026-08-12T10:00:00.000Z',
      createdAt: '2026-08-12T10:00:00.000Z',
    },
  ],
};

function moneyRecord(direction: 'lent' | 'borrowed'): LoanRecord {
  return {
    ...record,
    loan: {
      ...record.loan,
      direction,
      assetKind: 'money',
      itemName: null,
      quantity: null,
      currencyCode: 'EUR',
      originalMinorUnits: 10000n,
    },
    repayments: [
      {
        id: 'repayment-1',
        loanId: 'drill',
        minorUnits: 3000n,
        currencyCode: 'EUR',
        occurredOn: '2026-08-15',
        note: null,
        createdAt: '2026-08-15T10:00:00.000Z',
        version: 1,
        deletedAt: null,
      },
    ],
    events: [
      ...record.events,
      {
        id: 'event-2',
        loanId: 'drill',
        type: 'repayment_added',
        summaryKey: 'history.repaymentAdded',
        summaryParams: { amount: '3000', currency: 'EUR', person: 'Peter' },
        occurredAt: '2026-08-15T10:00:00.000Z',
        createdAt: '2026-08-15T10:00:00.000Z',
      },
    ],
  };
}

describe('DetailPage', () => {
  it('orders identity, status, action, details and history for quick scanning', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'drill' } } } },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            loanDetail: async () => record,
            daysUntilDue: () => -2,
            markReturned: async () => record.loan,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.detail-hero h1')?.textContent).toContain('Cordless drill');
    expect(root.querySelector('.detail-context')?.textContent).toContain('You lent this to Peter');
    expect(root.querySelector('.detail-hero app-handoff-line')?.textContent).toContain('Peter');
    expect(root.querySelector('.detail-workspace')).toBeTruthy();
    expect(root.querySelector('.detail-action-rail h2')?.textContent).toContain('Next step');
    expect(root.querySelector('.person-link')?.textContent).toContain('Peter');
    expect(root.querySelector('.status-panel')?.textContent).toContain('Overdue by 2 days');
    expect(root.querySelector('.primary-detail-action')?.textContent).toContain('Returned to me');
    expect(root.querySelector('.detail-summary')?.textContent).toContain('For the hallway shelves');
    expect(root.querySelector('.timeline')?.textContent).toContain('Cordless drill');
    expect(root.querySelector('.timeline time')).toBeTruthy();
  });

  it('uses the correct return wording for an item the user borrowed', async () => {
    const borrowedRecord: LoanRecord = {
      ...record,
      loan: {
        ...record.loan,
        direction: 'borrowed',
      },
    };
    await TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'drill' } } } },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            loanDetail: async () => borrowedRecord,
            daysUntilDue: () => 2,
            markReturned: async () => borrowedRecord.loan,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.primary-detail-action')?.textContent,
    ).toContain('I returned it');
  });

  it('shows original, returned and remaining money with the repayment amount in history', async () => {
    const lentMoneyRecord = moneyRecord('lent');
    await TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'drill' } } } },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            loanDetail: async () => lentMoneyRecord,
            daysUntilDue: () => 2,
            repay: async () => lentMoneyRecord.loan,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-balance="original"]')?.textContent).toContain('€100.00');
    expect(root.querySelector('[data-balance="repaid"]')?.textContent).toContain('€30.00');
    expect(root.querySelector('[data-balance="remaining"]')?.textContent).toContain('€70.00');
    expect(root.querySelector('.repayment-form .section-heading')?.textContent).toContain(
      'How much was returned to you?',
    );
    expect(root.querySelector('.repayment-form button[type="submit"]')?.textContent).toContain(
      'Returned to me',
    );
    expect(root.querySelector('.timeline')?.textContent).toContain('Returned €30.00');
  });

  it('uses first-person repayment wording for money the user borrowed', async () => {
    const borrowedMoneyRecord = moneyRecord('borrowed');
    await TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'drill' } } } },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            loanDetail: async () => borrowedMoneyRecord,
            daysUntilDue: () => 2,
            repay: async () => borrowedMoneyRecord.loan,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.repayment-form .section-heading')?.textContent).toContain(
      'How much did you return?',
    );
    expect(root.querySelector('.repayment-form button[type="submit"]')?.textContent).toContain(
      'I returned this',
    );
  });

  it('moves the return date and renders the localized change in history', async () => {
    const changeDueDate = vi.fn(async () => record.loan);
    const recordWithChange: LoanRecord = {
      ...record,
      events: [
        ...record.events,
        {
          id: 'event-due',
          loanId: 'drill',
          type: 'due_date_changed',
          summaryKey: 'history.dueDateChanged',
          summaryParams: { date: '2026-08-25' },
          occurredAt: '2026-08-20T10:00:00.000Z',
          createdAt: '2026-08-20T10:00:00.000Z',
        },
      ],
    };
    await TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'drill' } } } },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            loanDetail: async () => recordWithChange,
            daysUntilDue: () => -2,
            changeDueDate,
            markReturned: async () => record.loan,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const details = root.querySelector('.due-editor') as HTMLDetailsElement;
    expect(details.querySelector('summary')?.textContent).toContain('Change return date');
    expect((details.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
    expect(root.querySelector('.timeline')?.textContent).toContain(
      'Return date changed to 25 Aug 2026',
    );

    details.open = true;
    fixture.detectChanges();
    const inputDebug = fixture.debugElement.query(By.css('.due-date-form input[type="date"]'));
    const input = inputDebug.nativeElement as HTMLInputElement;
    input.value = '2026-08-27';
    inputDebug.triggerEventHandler('input', { target: input });
    inputDebug.triggerEventHandler('ngModelChange', '2026-08-27');
    await fixture.whenStable();
    fixture.detectChanges();
    expect((details.querySelector('button') as HTMLButtonElement).disabled).toBe(false);
    details.querySelector('button')?.click();
    await fixture.whenStable();

    expect(changeDueDate).toHaveBeenCalledWith('drill', '2026-08-27');
  });

  it('gives a missing record a direct recovery path', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'missing' } } } },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            loanDetail: async () => undefined,
            daysUntilDue: () => null,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.missing-state')?.textContent).toContain(
      'This record is not on this device.',
    );
    expect(root.querySelector('.missing-state a[href="/records"]')?.textContent).toContain(
      'Back to records',
    );
    expect(root.querySelector('.missing-state a[href="/records"] app-icon')).toBeTruthy();
  });
});
