import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { CurrentDayService } from '../../application/current-day-service';
import { PeopleQueryService } from '../../application/people-query-service';
import type { Loan, Person } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { PersonPage } from './person-page';

const currentDayProvider = {
  provide: CurrentDayService,
  useValue: { daysUntilDue: () => null },
};

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {
    throw new Error('Deferred promise was resolved before initialization.');
  };
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

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

function person(id: string, displayName: string): Person {
  return {
    id,
    displayName,
    phone: null,
    email: null,
    notes: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    deletedAt: null,
  };
}

function overview(person: Person, loans: readonly Loan[] = []) {
  const activeLent = loans.filter(
    (record) => record.status === 'active' && record.direction === 'lent',
  );
  const activeBorrowed = loans.filter(
    (record) => record.status === 'active' && record.direction === 'borrowed',
  );
  return {
    person,
    activeLent,
    activeBorrowed,
    history: loans.filter((record) => record.status === 'completed'),
    lentItemCount: activeLent.filter((record) => record.assetKind === 'physical_item').length,
    borrowedItemCount: activeBorrowed.filter((record) => record.assetKind === 'physical_item')
      .length,
    owedToMe: [],
    iOwe: [],
    remainingMinorUnitsByLoan: new Map<string, bigint>(),
  };
}

function activatedRoute(id = 'p1') {
  const paramMap = new BehaviorSubject(convertToParamMap({ id }));
  return {
    paramMap,
    provider: {
      provide: ActivatedRoute,
      useValue: {
        snapshot: { paramMap: paramMap.value },
        paramMap: paramMap.asObservable(),
      },
    },
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
    const route = activatedRoute();
    await TestBed.configureTestingModule({
      imports: [PersonPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        route.provider,
        {
          provide: PeopleQueryService,
          useValue: {
            personOverview: async () => ({
              ...overview(person('p1', 'Andrei'), [lent, borrowed, completed]),
              lentItemCount: 1,
              borrowedItemCount: 1,
              owedToMe: [{ currencyCode: 'EUR', minorUnits: 5000n }],
              iOwe: [{ currencyCode: 'GBP', minorUnits: 2000n }],
            }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelector('h1')?.textContent).toContain('Andrei'));

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

  it('exposes an accessible loading boundary before the person resolves', async () => {
    const pending = deferred<ReturnType<typeof overview>>();
    const route = activatedRoute();
    await TestBed.configureTestingModule({
      imports: [PersonPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        route.provider,
        {
          provide: PeopleQueryService,
          useValue: {
            personOverview: () => pending.promise,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelector('[role="status"]')).toBeTruthy());

    expect(root.querySelector('.page')?.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.missing-state')).toBeNull();

    pending.resolve(overview(person('p1', 'Andrei')));
    await vi.waitFor(() => expect(root.querySelector('h1')?.textContent).toContain('Andrei'));
    expect(root.querySelector('.page')?.hasAttribute('aria-busy')).toBe(false);
  });

  it('shows a controlled error and retries the person read', async () => {
    const personOverview = vi
      .fn()
      .mockRejectedValueOnce(new Error('indexeddb unavailable'))
      .mockResolvedValue(overview(person('p1', 'Recovered Andrei')));
    const route = activatedRoute();
    await TestBed.configureTestingModule({
      imports: [PersonPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        route.provider,
        {
          provide: PeopleQueryService,
          useValue: {
            personOverview,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        'This person could not be loaded',
      ),
    );

    const retry = root.querySelector('.person-load-error button') as HTMLButtonElement;
    expect(retry.textContent).toContain('Retry');
    retry.click();

    await vi.waitFor(() => expect(root.querySelector('h1')?.textContent).toContain('Recovered'));
    expect(personOverview).toHaveBeenCalledTimes(2);
  });

  it('loads a changed route id and ignores the older response', async () => {
    const older = deferred<ReturnType<typeof overview>>();
    const newer = deferred<ReturnType<typeof overview>>();
    const personOverview = vi.fn((id: string) => (id === 'p1' ? older.promise : newer.promise));
    const route = activatedRoute('p1');
    await TestBed.configureTestingModule({
      imports: [PersonPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        route.provider,
        {
          provide: PeopleQueryService,
          useValue: {
            personOverview,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(personOverview).toHaveBeenCalledWith('p1'));

    route.paramMap.next(convertToParamMap({ id: 'p2' }));
    await vi.waitFor(() => expect(personOverview).toHaveBeenCalledTimes(2));
    newer.resolve(overview(person('p2', 'Birute')));
    await vi.waitFor(() => expect(root.querySelector('h1')?.textContent).toContain('Birute'));

    older.resolve(overview(person('p1', 'Andrei')));
    await older.promise;
    await Promise.resolve();

    expect(root.querySelector('h1')?.textContent).toContain('Birute');
    expect(root.textContent).not.toContain('Andrei');
  });

  it('reformats raw balances without querying IndexedDB again when language changes', async () => {
    const money = loan('money', {
      assetKind: 'money',
      itemName: null,
      quantity: null,
      currencyCode: 'EUR',
      originalMinorUnits: 10000n,
    });
    const response = {
      ...overview(person('p1', 'Andrei'), [money]),
      owedToMe: [{ currencyCode: 'EUR', minorUnits: 5000n }],
      remainingMinorUnitsByLoan: new Map([['money', 5000n]]),
    };
    const personOverview = vi.fn().mockResolvedValue(response);
    const route = activatedRoute();
    await TestBed.configureTestingModule({
      imports: [PersonPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        route.provider,
        {
          provide: PeopleQueryService,
          useValue: {
            personOverview,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.textContent).toContain('€50'));
    const english = root.querySelector('.person-active-lent')?.textContent;

    TestBed.inject(I18n).setLanguage('lt');
    await vi.waitFor(() =>
      expect(root.querySelector('.person-active-lent')?.textContent).not.toBe(english),
    );

    expect(personOverview).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.person-active-lent')?.textContent).toContain('50');
  });
});
