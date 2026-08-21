import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { AddPage } from './add-page';
import { vi } from 'vitest';

describe('AddPage', () => {
  it('marks required conditional fields after submit without starting a write', async () => {
    const createRecord = vi.fn(async () => ({ id: 'unexpected' }));
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            settings: async () => ({ preferredCurrency: 'EUR' }),
            people: async () => [],
            recordDraft: async () => undefined,
            saveRecordDraft: async () => undefined,
            clearRecordDraft: async () => undefined,
            createRecord,
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

  it('presents one accessible fast create form', async () => {
    await TestBed.configureTestingModule({
      imports: [AddPage],
      providers: [
        provideRouter([]),
        {
          provide: BorrowedApp,
          useValue: {
            settings: async () => ({ preferredCurrency: 'EUR' }),
            people: async () => [],
            recordDraft: async () => undefined,
            saveRecordDraft: async () => undefined,
            clearRecordDraft: async () => undefined,
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
        {
          provide: BorrowedApp,
          useValue: {
            settings: async () => ({ preferredCurrency: 'EUR' }),
            people: async () => [],
            recordDraft: async () => ({
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
            saveRecordDraft,
            clearRecordDraft,
            createRecord,
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
          provide: BorrowedApp,
          useValue: {
            settings: async () => ({ preferredCurrency: 'EUR' }),
            people: async () => [
              { id: 'person-peter', displayName: 'Peter' },
              { id: 'person-andrei', displayName: 'Andrei' },
            ],
            recordDraft: async () => undefined,
            saveRecordDraft: async () => undefined,
            clearRecordDraft: async () => undefined,
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
          provide: BorrowedApp,
          useValue: {
            settings: async () => ({ preferredCurrency: 'EUR' }),
            people: async () => people,
            recordDraft: async () => undefined,
            saveRecordDraft: async () => undefined,
            clearRecordDraft: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('#person') as HTMLInputElement;

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelectorAll('.chips button')).toHaveLength(8);
    });

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
