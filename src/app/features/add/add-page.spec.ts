import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { AddPage } from './add-page';
import { vi } from 'vitest';

describe('AddPage', () => {
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
    expect(root.querySelector('label[for="person"]')?.textContent).toContain('Who is it with?');
    expect(root.querySelector('label[for="item"]')?.textContent).toContain('What moved?');
    expect(choiceButtons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(choiceButtons[1]?.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('details summary')?.textContent).toContain('Add return date or note');
    expect(root.querySelector('button[type="submit"]')?.textContent).toContain('Save record');
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
});
