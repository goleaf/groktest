import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { SearchPage } from './search-page';

describe('SearchPage', () => {
  it('starts with a focused record-search workbench and useful guidance', async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            revision: signal(0),
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
});
