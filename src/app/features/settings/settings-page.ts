import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { LanguageSwitcher } from '../../ui/language-switcher';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, Icon, LanguageSwitcher, PageHeading],
  template: `
    <section class="page">
      <app-page-heading
        icon="settings"
        [title]="i18n.t('settings.title')"
        [intro]="i18n.t('settings.intro')"
      />
      <section class="settings-group" aria-labelledby="preferences-title">
        <h2 id="preferences-title" class="section-heading">
          <app-icon name="settings" />
          {{ i18n.t('settings.preferences') }}
        </h2>
        <label for="pref-currency">
          <span class="icon-line"><app-icon name="money" /> {{ i18n.t('settings.currency') }}</span>
          <select
            id="pref-currency"
            [ngModel]="currency()"
            (ngModelChange)="onCurrency($event)"
            name="pref-currency"
          >
            @for (code of currencies; track code) {
              <option [value]="code">{{ code }}</option>
            }
          </select>
        </label>
        <p class="hint">{{ i18n.t('settings.currencyHint') }}</p>
        <div class="language-preference">
          <span class="preference-label icon-line">
            <app-icon name="language" />
            {{ i18n.t('settings.language') }}
          </span>
          <app-language-switcher />
          <p class="hint">{{ i18n.t('settings.languageHint') }}</p>
        </div>
      </section>
      <section class="settings-group" aria-labelledby="your-data-title">
        <h2 id="your-data-title" class="section-heading">
          <app-icon name="device" />
          {{ i18n.t('settings.yourData') }}
        </h2>
        <p class="icon-line"><app-icon name="device" /> {{ i18n.t('settings.storage') }}</p>
        <button class="button" type="button" (click)="exportData()">
          <app-icon name="download" />
          {{ i18n.t('settings.export') }}
        </button>
      </section>
      <section class="settings-group" aria-labelledby="about-title">
        <h2 id="about-title" class="section-heading">
          <app-icon name="info" />
          {{ i18n.t('settings.about') }}
        </h2>
        <p class="icon-line"><app-icon name="info" /> {{ i18n.t('settings.aboutBody') }}</p>
        <p class="hint icon-line">
          <app-icon name="records" />
          {{ i18n.t('settings.version', { version }) }}
        </p>
      </section>
    </section>
  `,
})
export class SettingsPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly currency = signal<CurrencyCode>('EUR');
  protected readonly currencies = Object.keys(CURRENCY_EXPONENTS);
  protected readonly version = '0.1.0';

  constructor() {
    void this.app.settings().then((settings) => this.currency.set(settings.preferredCurrency));
  }

  protected async onCurrency(value: string): Promise<void> {
    const settings = await this.app.setPreferredCurrency(value);
    this.currency.set(settings.preferredCurrency);
  }

  protected async exportData(): Promise<void> {
    const json = await this.app.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'borrowed-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
