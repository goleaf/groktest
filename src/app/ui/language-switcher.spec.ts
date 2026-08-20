import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BorrowedApp } from '../data/borrowed-app';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  it('includes each visible language code in the accessible button name', async () => {
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
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'button.language-option',
      ),
    );

    expect(
      buttons.map((button) => button.querySelector('.language-name')?.textContent?.trim()),
    ).toEqual(['EN', 'RU', 'LT']);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Switch language to English (EN)',
      'Switch language to Русский (RU)',
      'Switch language to Lietuvių (LT)',
    ]);
  });
});
