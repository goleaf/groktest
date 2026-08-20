import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { DomainError } from '../../domain/errors';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import type { Person } from '../../domain/types';

@Component({
  selector: 'app-add-page',
  imports: [FormsModule],
  template: `
    <section class="page">
      <h1>{{ i18n.t('add.title') }}</h1>
      <form (ngSubmit)="save()" class="stack">
        <fieldset>
          <legend class="sr-only">{{ i18n.t('add.lent') }} / {{ i18n.t('add.borrowed') }}</legend>
          <div class="segmented">
            <button
              type="button"
              [class.on]="direction() === 'lent'"
              (click)="direction.set('lent')"
            >
              {{ i18n.t('add.lent') }}
            </button>
            <button
              type="button"
              [class.on]="direction() === 'borrowed'"
              (click)="direction.set('borrowed')"
            >
              {{ i18n.t('add.borrowed') }}
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend class="sr-only">{{ i18n.t('add.item') }} / {{ i18n.t('add.money') }}</legend>
          <div class="segmented">
            <button
              type="button"
              [class.on]="kind() === 'physical_item'"
              (click)="kind.set('physical_item')"
            >
              {{ i18n.t('add.item') }}
            </button>
            <button type="button" [class.on]="kind() === 'money'" (click)="kind.set('money')">
              {{ i18n.t('add.money') }}
            </button>
          </div>
        </fieldset>
        <label>
          {{ i18n.t('add.who') }}
          <input
            name="person"
            autocomplete="name"
            [ngModel]="personName()"
            (ngModelChange)="personName.set($event)"
            [placeholder]="i18n.t('add.personPlaceholder')"
            required
          />
        </label>
        @if (recents().length) {
          <p class="hint">{{ i18n.t('add.recents') }}</p>
          <ul class="chips">
            @for (person of recents(); track person.id) {
              <li>
                <button type="button" (click)="choosePerson(person)">
                  {{ person.displayName }}
                </button>
              </li>
            }
          </ul>
        }
        @if (kind() === 'physical_item') {
          <label>
            {{ i18n.t('add.itemLabel') }}
            <input
              name="item"
              [ngModel]="itemName()"
              (ngModelChange)="itemName.set($event)"
              [placeholder]="i18n.t('add.itemPlaceholder')"
              required
            />
          </label>
        } @else {
          <label>
            {{ i18n.t('add.amountLabel') }}
            <input
              name="amount"
              inputmode="decimal"
              [ngModel]="amount()"
              (ngModelChange)="amount.set($event)"
              [placeholder]="i18n.t('add.amountPlaceholder')"
              required
            />
          </label>
          <label>
            {{ i18n.t('add.currencyLabel') }}
            <select [ngModel]="currency()" (ngModelChange)="currency.set($event)" name="currency">
              @for (code of currencies; track code) {
                <option [value]="code">{{ code }}</option>
              }
            </select>
          </label>
        }
        <details>
          <summary>{{ i18n.t('add.more') }}</summary>
          <label>
            {{ i18n.t('add.dueLabel') }}
            <input type="date" name="due" [ngModel]="dueOn()" (ngModelChange)="dueOn.set($event)" />
          </label>
          <label>
            {{ i18n.t('add.noteLabel') }}
            <textarea
              name="note"
              rows="2"
              [ngModel]="note()"
              (ngModelChange)="note.set($event)"
            ></textarea>
          </label>
        </details>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="button" type="submit" [disabled]="busy()">
          {{ busy() ? i18n.t('add.saving') : i18n.t('add.save') }}
        </button>
      </form>
    </section>
  `,
})
export class AddPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly router = inject(Router);

  protected readonly direction = signal<'lent' | 'borrowed'>('lent');
  protected readonly kind = signal<'physical_item' | 'money'>('physical_item');
  protected readonly personName = signal('');
  protected readonly personId = signal<string | undefined>(undefined);
  protected readonly itemName = signal('');
  protected readonly amount = signal('');
  protected readonly currency = signal<CurrencyCode>('EUR');
  protected readonly dueOn = signal('');
  protected readonly note = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly recents = signal<Person[]>([]);
  protected readonly currencies = Object.keys(CURRENCY_EXPONENTS);

  constructor() {
    void this.app.settings().then((settings) => this.currency.set(settings.preferredCurrency));
    void this.app.people().then((people) => this.recents.set(people.slice(0, 8)));
  }

  protected choosePerson(person: Person): void {
    this.personName.set(person.displayName);
    this.personId.set(person.id);
  }

  protected async save(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      const loan = await this.app.createRecord({
        direction: this.direction(),
        kind: this.kind(),
        personName: this.personName(),
        personId: this.personId(),
        itemName: this.itemName(),
        amount: this.amount(),
        currency: this.currency(),
        dueOn: this.dueOn() || null,
        note: this.note() || null,
      });
      await this.router.navigate(['/loans', loan.id]);
    } catch (caught) {
      if (caught instanceof DomainError) {
        this.error.set(this.i18n.t(`errors.${caught.code}`));
      } else {
        this.error.set(this.i18n.t('add.error'));
      }
    } finally {
      this.busy.set(false);
    }
  }
}
