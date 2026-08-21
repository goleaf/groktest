import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BorrowedApp } from '../data/borrowed-app';
import { Shell } from './shell';

describe('Shell', () => {
  it('renders focused mobile navigation and expanded desktop navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            refreshCurrentDay: () => undefined,
            setPreferredLanguage: async (preferredLanguage: string) => ({ preferredLanguage }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    const mobileNavigation = root.querySelector('nav[aria-label="Primary navigation"]');
    const desktopNavigation = root.querySelector('nav[aria-label="Borrowed navigation"]');

    expect(text).toContain('Borrowed');
    expect(text).toContain('On this device');
    expect(text).toContain('Home');
    expect(text).toContain('Records');
    expect(text).toContain('Add');
    expect(text).toContain('Search');
    expect(text).toContain('More');
    expect(text).toContain('People');
    expect(text).toContain('History');
    expect(text).toContain('Settings');
    expect(mobileNavigation?.querySelectorAll('a')).toHaveLength(5);
    expect(mobileNavigation?.querySelector('a[href="/records"]')).toBeTruthy();
    expect(mobileNavigation?.querySelector('a[href="/search"]')).toBeTruthy();
    expect(root.querySelector('aside.app-navigation')).toBeNull();
    expect(root.querySelector('header.app-header')).toBeTruthy();
    expect(desktopNavigation?.querySelectorAll('a')).toHaveLength(4);
    expect(root.querySelector('.header-tools a[href="/search"]')).toBeTruthy();
    expect(root.querySelector('.header-tools a[href="/settings"]')).toBeTruthy();
    expect(root.querySelector('.header-add[href="/add"]')).toBeTruthy();
    expect(root.querySelector('footer.app-footer')).toBeTruthy();
    expect(root.querySelector('.brand-mark app-icon')).toBeTruthy();
    expect(root.querySelectorAll('.mobile-nav app-icon')).toHaveLength(5);
    expect(root.querySelector('a[href="#main"]')?.textContent).toContain('Skip to main content');
    expect(root.querySelectorAll('.language-option')).toHaveLength(3);
    expect(root.textContent).toContain('🇷🇺');
    expect(root.textContent).toContain('🇱🇹');
  });
});
