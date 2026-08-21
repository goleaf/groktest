import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { BorrowedApp } from '../data/borrowed-app';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  it('renders the compact header variant as one native language dropdown', async () => {
    let finishSaving = (): void => undefined;
    const setPreferredLanguage = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSaving = resolve;
        }),
    );

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [
        {
          provide: BorrowedApp,
          useValue: { setPreferredLanguage },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageSwitcher);
    fixture.componentRef.setInput('compact', true);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector<HTMLSelectElement>('select.language-select');

    expect(select?.getAttribute('aria-label')).toBe('Language selection');
    expect(
      Array.from(select?.options ?? []).map((option) => ({
        value: option.value,
        label: option.textContent?.trim(),
        accessibleName: option.getAttribute('aria-label'),
      })),
    ).toEqual([
      { value: 'en', label: 'EN', accessibleName: 'Switch language to English (EN)' },
      { value: 'ru', label: 'RU', accessibleName: 'Switch language to Русский (RU)' },
      { value: 'lt', label: 'LT', accessibleName: 'Switch language to Lietuvių (LT)' },
    ]);
    expect(root.querySelectorAll('button.language-option')).toHaveLength(0);

    select!.value = 'ru';
    select!.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(setPreferredLanguage).toHaveBeenCalledWith('ru');
    expect(select?.disabled).toBe(true);
    expect(select?.value).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');

    finishSaving();
    await Promise.resolve();
    await fixture.whenStable();

    expect(select?.disabled).toBe(false);
    expect(select?.value).toBe('ru');
  });

  it('keeps the expanded settings variant as three named buttons', async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [
        {
          provide: BorrowedApp,
          useValue: { setPreferredLanguage: async () => undefined },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'button.language-option',
      ),
    );

    expect(
      buttons.map((button) => button.querySelector('.language-name')?.textContent?.trim()),
    ).toEqual(['English', 'Русский', 'Lietuvių']);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Switch language to English (EN)',
      'Switch language to Русский (RU)',
      'Switch language to Lietuvių (LT)',
    ]);
  });
});
