import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { PeoplePage } from './people-page';

describe('PeoplePage', () => {
  it('renders people as scannable identity rows', async () => {
    await TestBed.configureTestingModule({
      imports: [PeoplePage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
            peopleWithCounts: async () => [
              {
                person: { id: 'p1', displayName: 'Peter' },
                activeCount: 2,
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

    expect(root.querySelector('.person-avatar')?.textContent).toContain('P');
    expect(root.querySelector('.record-row__identity')?.textContent).toContain('Peter');
    expect(root.querySelector('.row-chevron app-icon')).toBeTruthy();
  });
});
