import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { DomainError } from '../../domain/errors';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import type { Person } from '../../domain/types';
import { Icon } from '../../ui/icon';

@Component({
  selector: 'app-add-page',
  imports: [FormsModule, Icon],
  template: `
    <section class="page add-page">
      <header class="page-header">
        <div>
          <h1>{{ i18n.t('add.heading') }}</h1>
          <p class="page-intro">{{ i18n.t('add.intro') }}</p>
        </div>
      </header>
      <form (ngSubmit)="save()" class="stack">
        <div class="handoff-builder" [attr.aria-label]="i18n.t('add.handoffLabel')">
          <span class="handoff-word" aria-hidden="true">{{ i18n.t('add.subject') }}</span>
          <fieldset>
            <legend class="sr-only">{{ i18n.t('add.lent') }} / {{ i18n.t('add.borrowed') }}</legend>
            <div class="segmented">
              <button
                type="button"
                [class.on]="direction() === 'lent'"
                [attr.aria-pressed]="direction() === 'lent' ? 'true' : 'false'"
                (click)="direction.set('lent')"
              >
                {{ i18n.t('add.lent') }}
              </button>
              <button
                type="button"
                [class.on]="direction() === 'borrowed'"
                [attr.aria-pressed]="direction() === 'borrowed' ? 'true' : 'false'"
                (click)="direction.set('borrowed')"
              >
                {{ i18n.t('add.borrowed') }}
              </button>
            </div>
          </fieldset>
          <span class="handoff-word" aria-hidden="true">{{ i18n.t('add.article') }}</span>
          <fieldset>
            <legend class="sr-only">{{ i18n.t('add.item') }} / {{ i18n.t('add.money') }}</legend>
            <div class="segmented">
              <button
                type="button"
                [class.on]="kind() === 'physical_item'"
                [attr.aria-pressed]="kind() === 'physical_item' ? 'true' : 'false'"
                (click)="kind.set('physical_item')"
              >
                {{ i18n.t('add.item') }}
              </button>
              <button
                type="button"
                [class.on]="kind() === 'money'"
                [attr.aria-pressed]="kind() === 'money' ? 'true' : 'false'"
                (click)="kind.set('money')"
              >
                {{ i18n.t('add.money') }}
              </button>
            </div>
          </fieldset>
        </div>
        <label for="person">
          <span class="icon-line"><app-icon name="person" /> {{ i18n.t('add.who') }}</span>
          <input
            id="person"
            name="person"
            autocomplete="name"
            maxlength="120"
            [ngModel]="personName()"
            (ngModelChange)="updatePersonName($event)"
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
          <label for="item">
            <span class="icon-line"><app-icon name="item" /> {{ i18n.t('add.itemLabel') }}</span>
            <input
              id="item"
              name="item"
              maxlength="200"
              [ngModel]="itemName()"
              (ngModelChange)="itemName.set($event)"
              [placeholder]="i18n.t('add.itemPlaceholder')"
              required
            />
          </label>
        } @else {
          <label for="amount">
            <span class="icon-line"><app-icon name="money" /> {{ i18n.t('add.amountLabel') }}</span>
            <input
              id="amount"
              name="amount"
              inputmode="decimal"
              [ngModel]="amount()"
              (ngModelChange)="amount.set($event)"
              [placeholder]="i18n.t('add.amountPlaceholder')"
              required
            />
          </label>
          <label for="currency">
            <span class="icon-line"
              ><app-icon name="money" /> {{ i18n.t('add.currencyLabel') }}</span
            >
            <select
              id="currency"
              [ngModel]="currency()"
              (ngModelChange)="currency.set($event)"
              name="currency"
            >
              @for (code of currencies; track code) {
                <option [value]="code">{{ code }}</option>
              }
            </select>
          </label>
        }
        <details>
          <summary>{{ i18n.t('add.more') }}</summary>
          <label>
            <span class="icon-line"><app-icon name="calendar" /> {{ i18n.t('add.dueLabel') }}</span>
            <input type="date" name="due" [ngModel]="dueOn()" (ngModelChange)="dueOn.set($event)" />
          </label>
          <label>
            <span class="icon-line"><app-icon name="note" /> {{ i18n.t('add.noteLabel') }}</span>
            <textarea
              name="note"
              rows="2"
              maxlength="4000"
              [ngModel]="note()"
              (ngModelChange)="note.set($event)"
            ></textarea>
          </label>
        </details>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="button" type="submit" [disabled]="busy()">
          <app-icon name="check" />
          {{ busy() ? i18n.t('add.saving') : i18n.t('add.saveRecord') }}
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
  private readonly draftReady = signal(false);
  private draftTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    void this.loadForm();
    effect((onCleanup) => {
      const draft = {
        direction: this.direction(),
        kind: this.kind(),
        personName: this.personName(),
        personId: this.personId() ?? null,
        itemName: this.itemName(),
        amount: this.amount(),
        currency: this.currency(),
        dueOn: this.dueOn(),
        note: this.note(),
      };
      if (!this.draftReady()) {
        return;
      }
      this.draftTimer = setTimeout(() => {
        const hasUserContent = Boolean(
          draft.personName.trim() ||
          draft.itemName.trim() ||
          draft.amount.trim() ||
          draft.dueOn ||
          draft.note.trim(),
        );
        const persistence = hasUserContent
          ? this.app.saveRecordDraft(draft)
          : this.app.clearRecordDraft();
        void persistence.catch(() => undefined);
      }, 250);
      const timer = this.draftTimer;
      onCleanup(() => {
        clearTimeout(timer);
        if (this.draftTimer === timer) {
          this.draftTimer = undefined;
        }
      });
    });
  }

  private async loadForm(): Promise<void> {
    const [settings, people, draft] = await Promise.all([
      this.app.settings(),
      this.app.people(),
      this.app.recordDraft(),
    ]);
    this.recents.set(people.slice(0, 8));
    if (draft) {
      this.direction.set(draft.direction);
      this.kind.set(draft.kind);
      this.personName.set(draft.personName);
      this.personId.set(draft.personId ?? undefined);
      this.itemName.set(draft.itemName);
      this.amount.set(draft.amount);
      this.currency.set(draft.currency);
      this.dueOn.set(draft.dueOn);
      this.note.set(draft.note);
    } else {
      this.currency.set(settings.preferredCurrency);
    }
    this.draftReady.set(true);
  }

  protected updatePersonName(value: string): void {
    const selected = this.recents().find((person) => person.id === this.personId());
    if (selected && selected.displayName !== value) {
      this.personId.set(undefined);
    }
    this.personName.set(value);
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
      this.draftReady.set(false);
      if (this.draftTimer) {
        clearTimeout(this.draftTimer);
        this.draftTimer = undefined;
      }
      await this.app.clearRecordDraft();
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
