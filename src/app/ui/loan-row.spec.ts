import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BorrowedApp } from '../data/borrowed-app';
import type { Loan } from '../domain/types';
import { I18n } from '../i18n/i18n';
import { LoanRow } from './loan-row';

const loan: Loan = {
  id: 'drill',
  direction: 'lent',
  assetKind: 'physical_item',
  status: 'active',
  personId: 'peter',
  personNameSnapshot: 'Peter',
  occurredOn: '2026-08-12',
  dueOn: '2026-08-18',
  returnedOn: null,
  note: null,
  itemName: 'Cordless drill',
  itemDescription: null,
  quantity: 1,
  currencyCode: null,
  originalMinorUnits: null,
  createdAt: '2026-08-12T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
  version: 1,
  deletedAt: null,
};

describe('LoanRow', () => {
  it('keeps identity, context, status and open affordance in one row', async () => {
    await TestBed.configureTestingModule({
      imports: [LoanRow],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: { daysUntilDue: () => -2 },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoanRow);
    fixture.componentRef.setInput('loan', loan);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.row-leading app-icon')).toBeTruthy();
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('Peter');
    expect(root.querySelector('.record-row__asset')?.textContent).toContain('Cordless drill');
    expect(root.querySelector('.handoff-line')?.textContent).toContain('You');
    expect(root.querySelector('.handoff-line')?.textContent).toContain('Peter');
    expect(root.querySelector('.record-row__direction')?.textContent).toContain('You lent it');
    expect(root.querySelector('.meta')?.textContent).toContain('Overdue by 2 days');
    expect(root.querySelector('.meta app-icon')).toBeTruthy();
    expect(root.querySelector('.row-chevron app-icon')).toBeTruthy();
  });

  it('formats a raw remaining balance with the active locale', async () => {
    const moneyLoan: Loan = {
      ...loan,
      id: 'money',
      assetKind: 'money',
      itemName: null,
      quantity: null,
      currencyCode: 'EUR',
      originalMinorUnits: 10000n,
      dueOn: null,
    };
    await TestBed.configureTestingModule({
      imports: [LoanRow],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: { daysUntilDue: () => null },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoanRow);
    fixture.componentRef.setInput('loan', moneyLoan);
    fixture.componentRef.setInput('remainingMinorUnits', 5000n);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const english = root.querySelector('.status-with-icon')?.textContent;

    expect(english).toContain('€50.00 remaining');

    TestBed.inject(I18n).setLanguage('lt');
    await fixture.whenStable();

    expect(root.querySelector('.status-with-icon')?.textContent).toContain('Liko 50,00 €');
  });
});
