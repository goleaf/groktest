import { Component, inject, input, signal } from '@angular/core';
import { BorrowedApp } from '../data/borrowed-app';
import type { SupportedLanguage } from '../domain/types';
import { I18n, LANGUAGE_OPTIONS } from '../i18n/i18n';
import { Icon } from './icon';

@Component({
  selector: 'app-language-switcher',
  imports: [Icon],
  template: `
    @if (compact()) {
      <label class="language-select-wrap" [class.language-select-saving]="saving() !== null">
        <app-icon name="language" />
        <select
          class="language-select"
          name="interface-language"
          [attr.aria-label]="i18n.t('language.label')"
          [value]="i18n.language()"
          [disabled]="saving() !== null"
          (change)="changeLanguage($event)"
        >
          @for (option of options; track option.code) {
            <option
              [value]="option.code"
              [selected]="i18n.language() === option.code"
              [attr.aria-label]="
                i18n.t('language.choose', {
                  language: option.name,
                  code: option.code.toUpperCase(),
                })
              "
            >
              {{ option.code.toUpperCase() }}
            </option>
          }
        </select>
        <app-icon class="language-select-chevron" name="chevron" />
      </label>
    } @else {
      <div class="language-switcher" role="group" [attr.aria-label]="i18n.t('language.label')">
        @for (option of options; track option.code) {
          <button
            class="language-option"
            type="button"
            [class.active]="i18n.language() === option.code"
            [attr.aria-label]="
              i18n.t('language.choose', {
                language: option.name,
                code: option.code.toUpperCase(),
              })
            "
            [attr.aria-pressed]="i18n.language() === option.code"
            [disabled]="saving() !== null"
            (click)="select(option.code)"
          >
            <span class="language-flag" aria-hidden="true">{{ option.flag }}</span>
            <span class="language-name">{{ option.name }}</span>
          </button>
        }
      </div>
    }
    @if (saveFailed()) {
      <p class="language-error" role="alert">{{ i18n.t('language.saveError') }}</p>
    }
  `,
})
export class LanguageSwitcher {
  readonly compact = input(false);
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly options = LANGUAGE_OPTIONS;
  protected readonly saving = signal<SupportedLanguage | null>(null);
  protected readonly saveFailed = signal(false);

  protected changeLanguage(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    void this.select(select.value as SupportedLanguage);
  }

  protected async select(language: SupportedLanguage): Promise<void> {
    if (language === this.i18n.language() || this.saving()) {
      return;
    }

    const previous = this.i18n.language();
    this.saveFailed.set(false);
    this.saving.set(language);
    this.i18n.setLanguage(language);
    try {
      await this.app.setPreferredLanguage(language);
    } catch {
      this.i18n.setLanguage(previous);
      this.saveFailed.set(true);
    } finally {
      this.saving.set(null);
    }
  }
}
