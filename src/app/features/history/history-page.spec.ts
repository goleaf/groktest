import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BorrowedApp } from '../../data/borrowed-app';
import { HistoryPage } from './history-page';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('HistoryPage', () => {
  it('shows loading feedback before deciding that history is empty', async () => {
    const pending = deferred<never[]>();
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
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

    pending.resolve([]);
    await vi.waitFor(() => expect(root.querySelector('app-empty-state')).toBeTruthy());
  });
});
