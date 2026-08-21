import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BorrowedApp } from '../data/borrowed-app';
import { Shell } from './shell';

@Component({ template: '<h1>Test page</h1><input aria-label="Page search" />' })
class TestPage {}

const borrowedAppStub = {
  refreshCurrentDay: () => undefined,
  setPreferredLanguage: async (preferredLanguage: string) => ({ preferredLanguage }),
};

describe('Shell', () => {
  it('renders focused mobile navigation and expanded desktop navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: borrowedAppStub,
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
    expect(root.querySelectorAll('.header-tools select.language-select')).toHaveLength(1);
    expect(root.querySelectorAll('.header-tools .language-option')).toHaveLength(0);
  });

  it('updates the localized document title and focuses main after navigation', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: '', component: TestPage, data: { titleKey: 'home.title' } },
              { path: 'records', component: TestPage, data: { titleKey: 'records.title' } },
            ],
          },
        ]),
        { provide: BorrowedApp, useValue: borrowedAppStub },
      ],
    }).compileComponents();

    document.title = 'Borrowed';
    const harness = await RouterTestingHarness.create('/records');
    await harness.fixture.whenStable();
    const main = harness.fixture.nativeElement.querySelector('main') as HTMLElement;

    expect(document.title).toBe('Records · Borrowed');
    expect(main.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(main);
  });

  it('marks grouped mobile destinations as the current page', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: 'loans/:id', component: TestPage, data: { titleKey: 'detail.title' } },
              { path: 'people', component: TestPage, data: { titleKey: 'people.title' } },
            ],
          },
        ]),
        { provide: BorrowedApp, useValue: borrowedAppStub },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/loans/drill');
    await harness.fixture.whenStable();
    const root = harness.fixture.nativeElement as HTMLElement;
    const records = root.querySelector('.mobile-nav a[href="/records"]');

    expect(records?.getAttribute('aria-current')).toBe('page');

    await harness.navigateByUrl('/people');
    await harness.fixture.whenStable();
    const more = root.querySelector('.mobile-nav a[href="/more"]');

    expect(more?.getAttribute('aria-current')).toBe('page');
  });

  it('keeps control focus when only query parameters change', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: 'records', component: TestPage, data: { titleKey: 'records.title' } },
            ],
          },
        ]),
        { provide: BorrowedApp, useValue: borrowedAppStub },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/records');
    await harness.fixture.whenStable();
    const input = harness.fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();

    await TestBed.inject(Router).navigateByUrl('/records?q=peter');
    await harness.fixture.whenStable();

    expect(document.activeElement).toBe(input);
  });
});
