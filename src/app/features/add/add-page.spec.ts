import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { PeopleQueryService } from '../../application/people-query-service';
import { RecordDraftService } from '../../application/record-draft-service';
import { SettingsService } from '../../application/settings-service';
import { BorrowedApp } from '../../data/borrowed-app';
import { deferred } from '../../testing/deferred-promise';
import { AddPage } from './add-page';

const emptyPeopleQueryProvider = {
  provide: PeopleQueryService,
  useValue: { people: async () => [] },
};

describe('AddPage', () => {
  it('marks required conditional fields after submit without starting a write', async () => {
    const createRecord = vi.fn(async () => ({ id: 'unexpected' }));
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {
            createRecord,
          },
        },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('#person-error')?.textContent).toContain('Enter or choose a person');
    expect(root.querySelector('#item-error')?.textContent).toContain('Enter the item or object');
    expect(root.querySelector('#amount-error')).toBeNull();
    expect(createRecord).not.toHaveBeenCalled();

    (
      root
        .querySelectorAll('.handoff-builder fieldset')[1]
        ?.querySelectorAll('button')[1] as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('#item-error')).toBeNull();
    expect(root.querySelector('#amount-error')?.textContent).toContain('Enter an amount');
    expect(createRecord).not.toHaveBeenCalled();
  });

  it('submits money after an overlong item field becomes hidden', async () => {
    const createRecord = vi.fn(async () => ({ id: 'loan-money' }));
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {
            createRecord,
          },
        },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const person = root.querySelector('#person') as HTMLInputElement;
    const item = root.querySelector('#item') as HTMLInputElement;

    person.value = 'Peter';
    person.dispatchEvent(new Event('input'));
    item.value = 'x'.repeat(201);
    item.dispatchEvent(new Event('input'));
    (
      root
        .querySelectorAll('.handoff-builder fieldset')[1]
        ?.querySelectorAll('button')[1] as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const amount = root.querySelector('#amount') as HTMLInputElement;
    amount.value = '25';
    amount.dispatchEvent(new Event('input'));

    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(createRecord).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'money', amount: '25', personName: 'Peter' }),
    );
  });

  it('submits an item after an overlong amount field becomes hidden', async () => {
    const createRecord = vi.fn(async () => ({ id: 'loan-item' }));
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {
            createRecord,
          },
        },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const kindButtons = root
      .querySelectorAll('.handoff-builder fieldset')[1]
      ?.querySelectorAll('button');

    (kindButtons?.[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const amount = root.querySelector('#amount') as HTMLInputElement;
    amount.value = '9'.repeat(81);
    amount.dispatchEvent(new Event('input'));
    (kindButtons?.[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    const person = root.querySelector('#person') as HTMLInputElement;
    const item = root.querySelector('#item') as HTMLInputElement;
    person.value = 'Peter';
    person.dispatchEvent(new Event('input'));
    item.value = 'Drill';
    item.dispatchEvent(new Event('input'));

    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(createRecord).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'physical_item', itemName: 'Drill', personName: 'Peter' }),
    );
  });

  it('does not mount the form until settings, people, and draft initialization completes', async () => {
    const settings = deferred<{ preferredCurrency: 'EUR' }>();
    const people = deferred<never[]>();
    const savedDraft = {
      direction: 'borrowed',
      kind: 'money',
      personName: 'Anna',
      personId: null,
      itemName: '',
      amount: '25',
      currency: 'GBP',
      dueOn: '2026-08-30',
      note: 'Lunch',
    } as const;
    const recordDraft = deferred<typeof savedDraft | undefined>();
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        {
          provide: PeopleQueryService,
          useValue: {
            people: () => people.promise,
          },
        },
        { provide: BorrowedApp, useValue: {} },
        { provide: SettingsService, useValue: { get: () => settings.promise } },
        {
          provide: RecordDraftService,
          useValue: {
            load: () => recordDraft.promise,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const initialStatus = root.querySelector('[role="status"]')?.textContent;
    const initiallyMountedForm = root.querySelector('form');
    const initialAriaBusy = root.querySelector('.add-page')?.getAttribute('aria-busy');

    settings.resolve({ preferredCurrency: 'EUR' });
    people.resolve([]);
    recordDraft.resolve(savedDraft);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((root.querySelector('#person') as HTMLInputElement).value).toBe('Anna');
    });

    expect(initialStatus).toContain('Loading your saved draft');
    expect(initiallyMountedForm).toBeNull();
    expect(initialAriaBusy).toBe('true');
    expect(root.querySelector('.add-page')?.hasAttribute('aria-busy')).toBe(false);
    expect((root.querySelector('#amount') as HTMLInputElement).value).toBe('25');
  });

  it('shows an initialization error and retries loading the form', async () => {
    const settings = vi
      .fn()
      .mockRejectedValueOnce(new Error('indexeddb unavailable'))
      .mockResolvedValue({ preferredCurrency: 'EUR' });
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {},
        },
        { provide: SettingsService, useValue: { get: settings } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('.add-initialization-error[role="alert"]')?.textContent).toContain(
        'Couldn’t load this form',
      );
    });
    expect(root.querySelector('form')).toBeNull();

    (root.querySelector('.add-initialization-error button') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('form')).toBeTruthy();
    });
    expect(settings).toHaveBeenCalledTimes(2);
  });

  it('keeps form data visible when draft persistence fails', async () => {
    const saveRecordDraft = vi.fn(async () => {
      throw new Error('quota exceeded');
    });
    const createRecord = vi.fn(async () => ({ id: 'unexpected' }));
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {
            createRecord,
          },
        },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: saveRecordDraft,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const person = root.querySelector('#person') as HTMLInputElement;

    person.value = 'Peter';
    person.dispatchEvent(new Event('input'));

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('.draft-status[role="alert"]')?.textContent).toContain('draft');
    });

    expect((root.querySelector('#person') as HTMLInputElement).value).toBe('Peter');
    expect(createRecord).not.toHaveBeenCalled();
  });

  it('ignores an older draft failure after a newer persistence generation starts', async () => {
    const older = deferred<void>();
    const newer = deferred<void>();
    const save = vi.fn().mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        { provide: BorrowedApp, useValue: {} },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: { load: async () => undefined, save, clear: async () => undefined },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const person = root.querySelector('#person') as HTMLInputElement;

    person.value = 'Peter';
    person.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));

    person.value = 'Peter updated';
    person.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));

    older.reject(new Error('older write failed'));
    await Promise.resolve();
    fixture.detectChanges();
    expect(root.querySelector('.draft-status[role="alert"]')).toBeNull();
    expect(root.querySelector('.draft-status[role="status"]')?.textContent).toContain('Saving');

    newer.resolve();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('.draft-status[role="status"]')?.textContent).toContain('saved');
    });
  });

  it('presents one accessible fast create form', async () => {
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {},
        },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const choiceButtons = root.querySelectorAll('.segmented button');

    expect(root.querySelector('.page-header h1')?.textContent).toContain('New record');
    expect(root.querySelector('.handoff-builder')?.textContent).toContain('I lent');
    expect(root.querySelector('.handoff-word')).toBeNull();
    expect(root.querySelector('label[for="person"]')?.textContent).toContain(
      'Who did you lend to?',
    );
    expect(root.querySelector('label[for="item"]')?.textContent).toContain('What moved?');
    expect(choiceButtons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(choiceButtons[1]?.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('label[for="due"]')?.textContent).toContain(
      'They should return it by (optional)',
    );
    expect(root.querySelector('details input[type="date"]')).toBeNull();
    expect(root.querySelector('details summary')?.textContent).toContain('Add a note');
    expect(root.querySelector('button[type="submit"]')?.textContent).toContain('Save record');
    expect(root.querySelector('.add-preview h2')?.textContent).toContain('Record preview');
    expect(root.querySelector('.add-preview app-handoff-line')).toBeTruthy();
    expect(root.querySelector('.add-preview')?.textContent).toContain('Person’s name');
    expect(root.querySelector('.add-preview')?.textContent).toContain('Item or object');

    choiceButtons[1]?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(root.querySelector('label[for="person"]')?.textContent).toContain(
      'Who did you borrow from?',
    );
    expect(root.querySelector('label[for="due"]')?.textContent).toContain(
      'I should return it by (optional)',
    );
  });

  it('restores a local draft and clears it after a successful save', async () => {
    const clearRecordDraft = vi.fn(async () => undefined);
    const saveRecordDraft = vi.fn(async () => undefined);
    const createRecord = vi.fn(async () => ({ id: 'loan-1' }));
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        emptyPeopleQueryProvider,
        {
          provide: BorrowedApp,
          useValue: {
            createRecord,
          },
        },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => ({
              direction: 'borrowed',
              kind: 'money',
              personName: 'Anna',
              personId: null,
              itemName: '',
              amount: '25',
              currency: 'GBP',
              dueOn: '2026-08-30',
              note: 'Lunch',
            }),
            save: saveRecordDraft,
            clear: clearRecordDraft,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((root.querySelector('#person') as HTMLInputElement).value).toBe('Anna');
    });
    expect((root.querySelector('#amount') as HTMLInputElement).value).toBe('25');
    expect((root.querySelector('#currency') as HTMLSelectElement).value).toBe('GBP');

    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(createRecord).toHaveBeenCalledWith(expect.objectContaining({ personName: 'Anna' }));
    expect(clearRecordDraft).toHaveBeenCalledOnce();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(saveRecordDraft).not.toHaveBeenCalled();
  });

  it('preselects the stable person passed from a person page', async () => {
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ personId: 'person-andrei' }) },
          },
        },
        {
          provide: PeopleQueryService,
          useValue: {
            people: async () => [
              { id: 'person-peter', displayName: 'Peter' },
              { id: 'person-andrei', displayName: 'Andrei' },
            ],
          },
        },
        { provide: BorrowedApp, useValue: {} },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((root.querySelector('#person') as HTMLInputElement).value).toBe('Andrei');
    });
    expect(root.querySelector('.chips button[aria-pressed="true"]')?.textContent).toContain(
      'Andrei',
    );
  });

  it('finds an existing person beyond the recent choices as the name is typed', async () => {
    const people = Array.from({ length: 8 }, (_, index) => ({
      id: `person-${index}`,
      displayName: `Recent ${index}`,
    }));
    people.push({ id: 'person-anna', displayName: 'Anna' });
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        {
          provide: PeopleQueryService,
          useValue: {
            people: async () => people,
          },
        },
        { provide: BorrowedApp, useValue: {} },
        { provide: SettingsService, useValue: { get: async () => ({ preferredCurrency: 'EUR' }) } },
        {
          provide: RecordDraftService,
          useValue: {
            load: async () => undefined,
            save: async () => undefined,
            clear: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelectorAll('.chips button')).toHaveLength(8);
    });

    const input = root.querySelector('#person') as HTMLInputElement;
    input.value = 'ann';
    input.dispatchEvent(new Event('input'));

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        [...root.querySelectorAll('.chips button')].some((button) =>
          button.textContent?.includes('Anna'),
        ),
      ).toBe(true);
    });
  });
});
