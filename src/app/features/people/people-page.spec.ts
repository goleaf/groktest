import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { PeopleQueryService } from '../../application/people-query-service';
import { PeoplePage } from './people-page';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('PeoplePage', () => {
  it('renders searchable people with both active directions and history', async () => {
    await TestBed.configureTestingModule({
      imports: [PeoplePage],
      providers: [
        provideRouter([]),
        {
          provide: PeopleQueryService,
          useValue: {
            peopleWithCounts: async () => [
              {
                person: { id: 'p1', displayName: 'Peter' },
                activeCount: 2,
                lentActiveCount: 1,
                borrowedActiveCount: 1,
                historyCount: 1,
              },
              {
                person: { id: 'p2', displayName: 'Anna' },
                activeCount: 0,
                lentActiveCount: 0,
                borrowedActiveCount: 0,
                historyCount: 2,
              },
            ],
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PeoplePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.people-overview > div')).toHaveLength(4);
    expect(root.querySelector('.people-overview')?.textContent).toContain('2');
    expect(root.querySelector('.people-overview')?.textContent).toContain('Open handoffs');
    expect(root.querySelector('.person-avatar')?.textContent).toContain('P');
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('Peter');
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('1 lent');
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('1 borrowed');
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('1 in history');
    expect(root.querySelector('.row-chevron app-icon')).toBeTruthy();
    const search = root.querySelector('#people-search') as HTMLInputElement;
    expect(search).toBeTruthy();

    search.value = 'anna';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelectorAll('.loan-row')).toHaveLength(1);
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('Anna');
  });

  it('shows loading feedback before deciding that the people list is empty', async () => {
    const pending = deferred<never[]>();
    await TestBed.configureTestingModule({
      imports: [PeoplePage],
      providers: [
        provideRouter([]),
        {
          provide: PeopleQueryService,
          useValue: {
            peopleWithCounts: () => pending.promise,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PeoplePage);
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelector('[role="status"]')).toBeTruthy());

    expect(root.querySelector('[role="status"]')?.textContent).toContain('Loading people');
    expect(root.querySelector('app-empty-state')).toBeNull();

    pending.resolve([]);
    await vi.waitFor(() => expect(root.querySelector('app-empty-state')).toBeTruthy());
  });
});
