import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

describe('Shell', () => {
  it('renders focused mobile navigation and expanded desktop navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    const mobileNavigation = root.querySelector('nav[aria-label="Primary"]');
    const desktopNavigation = root.querySelector('nav[aria-label="Workspace"]');

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
    expect(desktopNavigation?.querySelectorAll('a')).toHaveLength(6);
    expect(root.querySelector('.rail-add[href="/add"]')).toBeTruthy();
    expect(root.querySelector('.brand-mark app-icon')).toBeTruthy();
    expect(root.querySelectorAll('.mobile-nav app-icon')).toHaveLength(5);
    expect(root.querySelector('a[href="#main"]')?.textContent).toContain('Skip to main content');
  });
});
