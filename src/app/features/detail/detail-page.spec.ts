import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
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
            isOverdue: () => true,
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
    expect(root.querySelector('.person-link')?.textContent).toContain('Peter');
    expect(root.querySelector('.status-panel')?.textContent).toContain('Overdue');
    expect(root.querySelector('.primary-detail-action')?.textContent).toContain('Mark as returned');
    expect(root.querySelector('.detail-summary')?.textContent).toContain('For the hallway shelves');
    expect(root.querySelector('.timeline')?.textContent).toContain('Cordless drill');
    expect(root.querySelector('.timeline time')).toBeTruthy();
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
            isOverdue: () => false,
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
  });
});
