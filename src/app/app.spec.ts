import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ApplicationInitializationState } from './application-initialization';
import { provideBorrowedPersistence } from './data/borrowed-app';
import { browserClock, CLOCK } from './data/clock';
import { PersistenceCorruptionError } from './data/persistence-corruption';

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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a safe accessible state without routes or raw corruption details', () => {
    TestBed.inject(ApplicationInitializationState).reportCorruption(
      new PersistenceCorruptionError('local_settings', 'preferredCurrency', 'invalid_value'),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const main = root.querySelector('main');

    expect(main).toBeTruthy();
    expect(main?.querySelector('h1')?.textContent).toContain('local data could not be opened');
    expect(main?.querySelector('[role="alert"]')).toBeTruthy();
    expect(root.querySelector('router-outlet')).toBeNull();
    expect(root.textContent).not.toContain('preferredCurrency');
    expect(root.textContent).not.toContain('invalid_value');
  });
});
