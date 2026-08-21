import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CurrentDayService } from '../../application/current-day-service';
import { RecordsQueryService } from '../../application/records-query-service';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { SearchPage } from './search-page';

const currentDayProvider = {
  provide: CurrentDayService,
  useValue: { daysUntilDue: () => null },
};

const loan: Loan = {
  id: 'drill',
  direction: 'lent',
  assetKind: 'physical_item',
  status: 'active',
  personId: 'peter',
  personNameSnapshot: 'Peter',
  occurredOn: '2026-08-12',
  dueOn: null,
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('SearchPage', () => {
  it('starts with a focused record-search workbench and useful guidance', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        {
          provide: RecordsQueryService,
          useValue: {
            search: async () => [],
            remainingMap: async () => new Map(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.search-workbench')).toBeTruthy();
    expect(root.querySelector('input')?.getAttribute('aria-label')).toBe('Search records');
    expect(root.querySelector('.search-guidance')?.textContent).toContain(
      'Search names, items, notes, and amounts on this device.',
    );
  });

  it('shows a loading state instead of a false empty result while searching', async () => {
    const pending = deferred<Loan[]>();
    const search = vi.fn((query: string) =>
      query.trim() === 'drill' ? pending.promise : Promise.resolve([]),
    );
    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        {
          provide: RecordsQueryService,
          useValue: {
            search,
            remainingMap: async () => new Map(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SearchPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    input.value = 'drill';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith('drill'));

    expect(root.querySelector('[role="status"]')?.textContent).toContain('Searching');
    expect(root.textContent).not.toContain('Nothing matches');

    pending.resolve([loan]);
    await vi.waitFor(() =>
      expect(root.querySelector('.loan-list')?.textContent).toContain('drill'),
    );
  });

  it('does not let a slower earlier search replace newer results', async () => {
    const older = deferred<Loan[]>();
    const newer = deferred<Loan[]>();
    const newerLoan = { ...loan, id: 'saw', itemName: 'Circular saw' };
    const search = vi.fn((query: string) => {
      if (query === 'd') return older.promise;
      if (query === 'dr') return newer.promise;
      return Promise.resolve([]);
    });
    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        {
          provide: RecordsQueryService,
          useValue: {
            search,
            remainingMap: async () => new Map(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SearchPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;

    input.value = 'd';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith('d'));
    input.value = 'dr';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith('dr'));

    newer.resolve([newerLoan]);
    await vi.waitFor(() => expect(root.querySelector('.loan-list')?.textContent).toContain('saw'));
    older.resolve([loan]);
    await Promise.resolve();
    await fixture.whenStable();

    expect(root.querySelector('.loan-list')?.textContent).toContain('saw');
    expect(root.querySelector('.loan-list')?.textContent).not.toContain('drill');
  });

  it('reformats raw balances without repeating a search when language changes', async () => {
    const moneyLoan: Loan = {
      ...loan,
      id: 'money',
      assetKind: 'money',
      itemName: null,
      quantity: null,
      currencyCode: 'EUR',
      originalMinorUnits: 10000n,
    };
    const search = vi.fn().mockResolvedValue([moneyLoan]);
    const remainingMap = vi.fn().mockResolvedValue(new Map([['money', 5000n]]));
    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        {
          provide: RecordsQueryService,
          useValue: {
            search,
            remainingMap,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SearchPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    input.value = 'money';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(() =>
      expect(root.querySelector('.status-with-icon')?.textContent).toContain('€50.00 remaining'),
    );

    TestBed.inject(I18n).setLanguage('lt');
    await vi.waitFor(() =>
      expect(root.querySelector('.status-with-icon')?.textContent).toContain('Liko 50,00 €'),
    );

    expect(search).toHaveBeenCalledTimes(1);
    expect(remainingMap).toHaveBeenCalledTimes(1);
  });
});
