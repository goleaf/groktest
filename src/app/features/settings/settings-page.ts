import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, Icon],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ i18n.t('settings.title') }}</h1>
          <p class="page-intro">{{ i18n.t('settings.intro') }}</p>
        </div>
      </header>
      <section class="settings-group" aria-labelledby="preferences-title">
        <h2 id="preferences-title">{{ i18n.t('settings.preferences') }}</h2>
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
      </section>
      <section class="settings-group" aria-labelledby="your-data-title">
        <h2 id="your-data-title">{{ i18n.t('settings.yourData') }}</h2>
        <p class="icon-line"><app-icon name="device" /> {{ i18n.t('settings.storage') }}</p>
        <button class="button" type="button" (click)="exportData()">
          <app-icon name="note" />
          {{ i18n.t('settings.export') }}
        </button>
      </section>
      <section class="settings-group" aria-labelledby="about-title">
        <h2 id="about-title">{{ i18n.t('settings.about') }}</h2>
        <p>{{ i18n.t('settings.aboutBody') }}</p>
        <p class="hint">{{ i18n.t('settings.version', { version }) }}</p>
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
