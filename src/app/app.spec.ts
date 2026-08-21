import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import {
  ApplicationInitializationState,
  initializeBorrowedApplication,
} from './application-initialization';
import { BorrowedApp, provideBorrowedPersistence } from './data/borrowed-app';
import { browserClock, CLOCK } from './data/clock';
import { I18n } from './i18n/i18n';
import { deferred } from './testing/deferred-promise';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: CLOCK, useFactory: browserClock },
        ...provideBorrowedPersistence(),
      ],
    }).compileComponents();
  });

  it('keeps normal boot routed exactly as before', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.persistence-failure')).toBeNull();
  });

  it('renders accessible recovery actions without routes or raw corruption details', async () => {
    TestBed.inject(ApplicationInitializationState).reportFailure('corruption');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const main = root.querySelector('main');
    const restore = root.querySelector<HTMLButtonElement>('[data-recovery-action="restore"]');

    expect(main).toBeTruthy();
    expect(main?.querySelector('h1')?.textContent).toContain('local data could not be opened');
    expect(main?.querySelector('[role="alert"]')).toBeTruthy();
    expect(main?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(main);
    expect(root.querySelector('[data-recovery-action="retry"]')).toBeTruthy();
    expect(root.querySelector('[data-recovery-action="export"]')).toBeTruthy();
    expect(restore?.disabled).toBe(true);
    expect(root.textContent).toContain('permanently delete');
    expect(root.textContent).toContain('not available yet');
    expect(root.querySelector('router-outlet')).toBeNull();
    expect(root.textContent).not.toContain('preferredCurrency');
    expect(root.textContent).not.toContain('invalid_value');
  });

  it('never renders a raw storage exception and returns to normal routing after retry', async () => {
    const secret = 'Private note for Aistė';
    const unavailable = new Error(secret);
    unavailable.name = 'OpenFailedError';
    const app = TestBed.inject(BorrowedApp);
    vi.spyOn(app, 'initialize').mockRejectedValueOnce(unavailable).mockResolvedValueOnce({
      id: 'local',
      localIdentityId: 'identity-1',
      preferredCurrency: 'EUR',
      preferredLanguage: 'en',
      schemaVersion: 3,
      version: 1,
      createdAt: '2026-08-21T12:00:00.000Z',
      updatedAt: '2026-08-21T12:00:00.000Z',
    });
    const state = TestBed.inject(ApplicationInitializationState);

    await initializeBorrowedApplication({
      app,
      i18n: TestBed.inject(I18n),
      clock: TestBed.inject(CLOCK),
      state,
      development: false,
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).not.toContain(secret);
    root.querySelector<HTMLButtonElement>('[data-recovery-action="retry"]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('router-outlet')).toBeTruthy();
    expect(root.querySelector('.persistence-failure')).toBeNull();
    expect(root.textContent).not.toContain(secret);
  });

  it('keeps a generic usable recovery screen after a repeated retry failure', async () => {
    const secret = 'Private repayment note';
    const unavailable = new Error(secret);
    unavailable.name = 'QuotaExceededError';
    const app = TestBed.inject(BorrowedApp);
    const retryResult = deferred<Awaited<ReturnType<BorrowedApp['initialize']>>>();
    const initialize = vi
      .spyOn(app, 'initialize')
      .mockRejectedValueOnce(unavailable)
      .mockReturnValueOnce(retryResult.promise);
    const state = TestBed.inject(ApplicationInitializationState);

    await initializeBorrowedApplication({
      app,
      i18n: TestBed.inject(I18n),
      clock: TestBed.inject(CLOCK),
      state,
      development: false,
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const retry = root.querySelector<HTMLButtonElement>('[data-recovery-action="retry"]');

    retry?.focus();
    retry?.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(retry?.disabled).toBe(false);
    expect(retry?.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(retry);

    retryResult.reject(unavailable);
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('[role="status"]')?.textContent).toContain(
        'still could not be opened',
      );
    });

    expect(initialize).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.persistence-failure')).toBeTruthy();
    expect(root.textContent).not.toContain(secret);
    expect(retry?.disabled).toBe(false);
    expect(document.activeElement).toBe(retry);
  });

  it('downloads raw recovery data without inserting private contents into the page', async () => {
    const state = TestBed.inject(ApplicationInitializationState);
    state.reportFailure('unavailable');
    const app = TestBed.inject(BorrowedApp);
    const raw = '{"people":[{"displayName":"Aistė"}]}';
    vi.spyOn(app, 'exportRawRecoveryJson').mockResolvedValue(raw);
    const createObjectUrl = vi.fn(() => 'blob:borrowed-recovery');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('[data-recovery-action="export"]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(app.exportRawRecoveryJson).toHaveBeenCalledOnce();
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:borrowed-recovery');
    expect(root.textContent).not.toContain('Aistė');
    expect(root.querySelector('[role="status"]')?.textContent).toContain('downloaded');
  });

  it('reports diagnostic export failure without exposing its raw exception', async () => {
    const secret = 'Private person: Aistė';
    const state = TestBed.inject(ApplicationInitializationState);
    state.reportFailure('corruption');
    vi.spyOn(TestBed.inject(BorrowedApp), 'exportRawRecoveryJson').mockRejectedValue(
      new Error(secret),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('[data-recovery-action="export"]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[role="status"]')?.textContent).toContain('could not be prepared');
    expect(root.textContent).not.toContain(secret);
  });
});
