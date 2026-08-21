import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { DomainError } from '../../domain/errors';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import type { Person } from '../../domain/types';
import { HandoffLine } from '../../ui/handoff-line';
import { Icon } from '../../ui/icon';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-add-page',
  imports: [FormsModule, HandoffLine, Icon, PageHeading],
  template: `
    <section class="page add-page">
      <app-page-heading icon="add" [title]="i18n.t('add.heading')" [intro]="i18n.t('add.intro')" />
      <div class="add-workspace">
        <form (ngSubmit)="save()" class="stack add-form">
          <div class="handoff-builder" [attr.aria-label]="i18n.t('add.handoffLabel')">
            <fieldset>
              <legend class="sr-only">
                {{ i18n.t('add.lent') }} / {{ i18n.t('add.borrowed') }}
              </legend>
              <div class="segmented">
                <button
                  type="button"
                  [class.on]="direction() === 'lent'"
                  [attr.aria-pressed]="direction() === 'lent' ? 'true' : 'false'"
                  (click)="direction.set('lent')"
                >
                  <app-icon class="control-icon" name="lent" />
                  {{ i18n.t('add.lent') }}
                </button>
                <button
                  type="button"
                  [class.on]="direction() === 'borrowed'"
                  [attr.aria-pressed]="direction() === 'borrowed' ? 'true' : 'false'"
                  (click)="direction.set('borrowed')"
                >
                  <app-icon class="control-icon" name="borrowed" />
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
                  [attr.aria-pressed]="kind() === 'physical_item' ? 'true' : 'false'"
                  (click)="kind.set('physical_item')"
                >
                  <app-icon class="control-icon" name="item" />
                  {{ i18n.t('add.item') }}
                </button>
                <button
                  type="button"
                  [class.on]="kind() === 'money'"
                  [attr.aria-pressed]="kind() === 'money' ? 'true' : 'false'"
                  (click)="kind.set('money')"
                >
                  <app-icon class="control-icon" name="money" />
                  {{ i18n.t('add.money') }}
                </button>
              </div>
            </fieldset>
          </div>
          <label for="person">
            <span class="icon-line"><app-icon name="person" /> {{ personPrompt() }}</span>
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
            <p class="hint icon-line">
              <app-icon [name]="personName().trim() && !personId() ? 'search' : 'history'" />
              {{ i18n.t(personName().trim() && !personId() ? 'add.matches' : 'add.recents') }}
            </p>
            <ul class="chips">
              @for (person of recents(); track person.id) {
                <li>
                  <button
                    type="button"
                    [class.on]="personId() === person.id"
                    [attr.aria-pressed]="personId() === person.id ? 'true' : 'false'"
                    (click)="choosePerson(person)"
                  >
                    <app-icon class="control-icon" name="person" />
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
              <span class="icon-line"
                ><app-icon name="money" /> {{ i18n.t('add.amountLabel') }}</span
              >
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
          <label for="due">
            <span class="icon-line"><app-icon name="calendar" /> {{ duePrompt() }}</span>
            <input
              id="due"
              type="date"
              name="due"
              [ngModel]="dueOn()"
              (ngModelChange)="dueOn.set($event)"
            />
          </label>
          <details>
            <summary><app-icon name="more" /> {{ i18n.t('add.more') }}</summary>
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
            <p class="error icon-line" role="alert"><app-icon name="warning" /> {{ error() }}</p>
          }
          <button class="button" type="submit" [disabled]="busy()">
            <app-icon name="check" />
            {{ busy() ? i18n.t('add.saving') : i18n.t('add.saveRecord') }}
          </button>
        </form>
        <aside class="add-preview" aria-live="polite" aria-labelledby="add-preview-title">
          <p class="section-kicker">{{ i18n.t('add.previewKicker') }}</p>
          <h2 id="add-preview-title">{{ i18n.t('add.previewTitle') }}</h2>
          <div class="preview-record">
            <span class="preview-icon" aria-hidden="true">
              <app-icon [name]="kind() === 'physical_item' ? 'item' : 'money'" />
            </span>
            <app-handoff-line [direction]="direction()" [personName]="previewPerson()" />
            <strong>{{ previewSubject() }}</strong>
            <small>{{ previewDue() }}</small>
          </div>
          <dl class="preview-facts">
            <div>
              <dt>{{ i18n.t('add.previewDirection') }}</dt>
              <dd>{{ i18n.t(direction() === 'lent' ? 'add.lent' : 'add.borrowed') }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('add.previewKind') }}</dt>
              <dd>{{ i18n.t(kind() === 'physical_item' ? 'add.item' : 'add.money') }}</dd>
            </div>
          </dl>
          <p class="preview-local"><app-icon name="info" /> {{ i18n.t('add.previewLocal') }}</p>
        </aside>
      </div>
    </section>
  `,
})
export class AddPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
  private readonly people = signal<Person[]>([]);
  protected readonly recents = computed(() => {
    const people = this.people();
    const query = this.personName().trim().toLocaleLowerCase(this.i18n.locale());
    if (!query || this.personId()) {
      const selected = people.find((person) => person.id === this.personId());
      return [selected, ...people.filter((person) => person.id !== selected?.id)]
        .filter((person): person is Person => Boolean(person))
        .slice(0, 8);
    }
    return people
      .filter((person) => person.displayName.toLocaleLowerCase(this.i18n.locale()).includes(query))
      .slice(0, 8);
  });
  protected readonly currencies = Object.keys(CURRENCY_EXPONENTS);
  protected readonly personPrompt = computed(() =>
    this.i18n.t(this.direction() === 'lent' ? 'add.personLent' : 'add.personBorrowed'),
  );
  protected readonly duePrompt = computed(() =>
    this.i18n.t(this.direction() === 'lent' ? 'add.dueLent' : 'add.dueBorrowed'),
  );
  protected readonly previewPerson = computed(
    () => this.personName().trim() || this.i18n.t('add.previewPerson'),
  );
  protected readonly previewSubject = computed(() => {
    if (this.kind() === 'physical_item') {
      return this.itemName().trim() || this.i18n.t('add.previewItem');
    }
    return this.amount().trim()
      ? `${this.amount().trim()} ${this.currency()}`
      : this.i18n.t('add.previewAmount');
  });
  protected readonly previewDue = computed(() => this.dueOn() || this.i18n.t('home.noDueDate'));
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
    this.people.set(people);
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
    const linkedPersonId = this.route.snapshot.queryParamMap.get('personId');
    const linkedPerson = people.find((person) => person.id === linkedPersonId);
    if (linkedPerson) {
      this.choosePerson(linkedPerson);
    }
    this.draftReady.set(true);
  }

  protected updatePersonName(value: string): void {
    const selected = this.people().find((person) => person.id === this.personId());
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
