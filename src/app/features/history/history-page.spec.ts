import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ApplicationRevision } from '../../application/application-revision';
import { CurrentDayService } from '../../application/current-day-service';
import { RecordsQueryService } from '../../application/records-query-service';
import type { Loan } from '../../domain/types';
import { deferred } from '../../testing/deferred-promise';
import { HistoryPage } from './history-page';

const currentDayProvider = {
  provide: CurrentDayService,
  useValue: { daysUntilDue: () => null },
};

function completedLoan(id: string, itemName: string): Loan {
  return {
    id,
    direction: 'lent',
    assetKind: 'physical_item',
    status: 'completed',
    personId: `person-${id}`,
    personNameSnapshot: 'Peter',
    occurredOn: '2026-08-01',
    dueOn: null,
    returnedOn: '2026-08-20',
    note: null,
    itemName,
    itemDescription: null,
    quantity: 1,
    currencyCode: null,
    originalMinorUnits: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
    version: 2,
    deletedAt: null,
  };
}

describe('HistoryPage', () => {
  it('shows loading feedback before deciding that history is empty', async () => {
    const pending = deferred<never[]>();
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        {
          provide: RecordsQueryService,
          useValue: {
            history: () => pending.promise,
            filterLoans: (loans: never[]) => loans,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelector('[role="status"]')).toBeTruthy());

    expect(root.querySelector('[role="status"]')?.textContent).toContain('Loading history');
    expect(root.querySelector('app-empty-state')).toBeNull();
    expect(root.querySelector('.page')?.getAttribute('aria-busy')).toBe('true');

    pending.resolve([]);
    await vi.waitFor(() => expect(root.querySelector('app-empty-state')).toBeTruthy());
    expect(root.querySelector('.page')?.hasAttribute('aria-busy')).toBe(false);
  });

  it('shows a load error and retries the history resource', async () => {
    const history = vi
      .fn()
      .mockRejectedValueOnce(new Error('indexeddb unavailable'))
      .mockResolvedValue([completedLoan('recovered', 'Recovered drill')]);
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        {
          provide: RecordsQueryService,
          useValue: {
            history,
            filterLoans: (loans: readonly Loan[]) => [...loans],
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => {
      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        'History could not be loaded',
      );
    });

    const retry = root.querySelector('.history-load-error button') as HTMLButtonElement;
    expect(retry?.textContent).toContain('Retry');
    retry.click();

    await vi.waitFor(() => expect(root.textContent).toContain('Recovered drill'));
    expect(history).toHaveBeenCalledTimes(2);
  });

  it('does not replace a newer generation with a stale history response', async () => {
    const revision = signal(0);
    const older = deferred<Loan[]>();
    const newer = deferred<Loan[]>();
    const history = vi.fn().mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideRouter([]),
        currentDayProvider,
        { provide: ApplicationRevision, useValue: { value: revision } },
        {
          provide: RecordsQueryService,
          useValue: {
            history,
            filterLoans: (loans: readonly Loan[]) => [...loans],
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(history).toHaveBeenCalledOnce());

    revision.set(1);
    await vi.waitFor(() => expect(history).toHaveBeenCalledTimes(2));
    newer.resolve([completedLoan('newer', 'Newer drill')]);
    await vi.waitFor(() => expect(root.textContent).toContain('Newer drill'));

    older.resolve([completedLoan('older', 'Older ladder')]);
    await older.promise;
    await Promise.resolve();
    fixture.detectChanges();

    expect(root.textContent).toContain('Newer drill');
    expect(root.textContent).not.toContain('Older ladder');
  });
});
