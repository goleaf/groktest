import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule],
  template: `
    <section class="page">
      <h1>{{ i18n.t('settings.title') }}</h1>
      <label>
        {{ i18n.t('settings.currency') }}
        <select [ngModel]="currency()" (ngModelChange)="onCurrency($event)" name="pref-currency">
          @for (code of currencies; track code) {
            <option [value]="code">{{ code }}</option>
          }
        </select>
      </label>
      <p class="hint">{{ i18n.t('settings.currencyHint') }}</p>
      <p>{{ i18n.t('settings.storage') }}</p>
      <p class="hint">{{ i18n.t('settings.version', { version }) }}</p>
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
}
