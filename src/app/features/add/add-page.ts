import { Component, computed, effect, inject, PendingTasks, signal } from '@angular/core';
import { FormField, form, hidden, maxLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { DomainError } from '../../domain/errors';
import { CURRENCY_EXPONENTS, type CurrencyCode } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import type { Person } from '../../domain/types';
import { HandoffLine } from '../../ui/handoff-line';
import { Icon } from '../../ui/icon';
import { PageHeading } from '../../ui/page-heading';

interface AddRecordFormModel {
  direction: 'lent' | 'borrowed';
  kind: 'physical_item' | 'money';
  personName: string;
  personId: string | null;
  itemName: string;
  amount: string;
  currency: CurrencyCode;
  dueOn: string;
  note: string;
}

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-add-page',
  imports: [FormField, HandoffLine, Icon, PageHeading],
  template: `
    <section class="page add-page" [attr.aria-busy]="initializing() ? 'true' : null">
      <app-page-heading icon="add" [title]="i18n.t('add.heading')" [intro]="i18n.t('add.intro')" />
      @if (initializing()) {
        <p class="loading-row icon-line" role="status">
          <app-icon name="clock" /> {{ i18n.t('add.loading') }}
        </p>
      } @else if (initializationError(); as message) {
        <div class="stack add-initialization-error" role="alert">
          <p class="error icon-line"><app-icon name="warning" /> {{ message }}</p>
          <button class="button" type="button" (click)="retryInitialization()">
            {{ i18n.t('add.retryLoad') }}
          </button>
        </div>
      } @else {
        <div class="add-workspace">
          <form (submit)="save($event)" class="stack add-form" novalidate>
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
                <legend class="sr-only">
                  {{ i18n.t('add.item') }} / {{ i18n.t('add.money') }}
                </legend>
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
                #personInput
                id="person"
                autocomplete="name"
                [formField]="addForm.personName"
                [attr.aria-invalid]="
                  addForm.personName().touched() && addForm.personName().invalid()
                "
                [attr.aria-describedby]="
                  addForm.personName().touched() && addForm.personName().invalid()
                    ? 'person-error'
                    : null
                "
                (input)="updatePersonName(personInput.value)"
                [placeholder]="i18n.t('add.personPlaceholder')"
              />
            </label>
            @if (addForm.personName().touched() && addForm.personName().invalid()) {
              <small id="person-error" class="field-error">{{
                addForm.personName().errors()[0]?.message
              }}</small>
            }
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
            @if (!addForm.itemName().hidden()) {
              <label for="item">
                <span class="icon-line"
                  ><app-icon name="item" /> {{ i18n.t('add.itemLabel') }}</span
                >
                <input
                  id="item"
                  [formField]="addForm.itemName"
                  [attr.aria-invalid]="addForm.itemName().touched() && addForm.itemName().invalid()"
                  [attr.aria-describedby]="
                    addForm.itemName().touched() && addForm.itemName().invalid()
                      ? 'item-error'
                      : null
                  "
                  [placeholder]="i18n.t('add.itemPlaceholder')"
                />
              </label>
              @if (addForm.itemName().touched() && addForm.itemName().invalid()) {
                <small id="item-error" class="field-error">{{
                  addForm.itemName().errors()[0]?.message
                }}</small>
              }
            } @else {
              <label for="amount">
                <span class="icon-line"
                  ><app-icon name="money" /> {{ i18n.t('add.amountLabel') }}</span
                >
                <input
                  id="amount"
                  inputmode="decimal"
                  [formField]="addForm.amount"
                  [attr.aria-invalid]="addForm.amount().touched() && addForm.amount().invalid()"
                  [attr.aria-describedby]="
                    addForm.amount().touched() && addForm.amount().invalid() ? 'amount-error' : null
                  "
                  [placeholder]="i18n.t('add.amountPlaceholder')"
                />
              </label>
              @if (addForm.amount().touched() && addForm.amount().invalid()) {
                <small id="amount-error" class="field-error">{{
                  addForm.amount().errors()[0]?.message
                }}</small>
              }
              <label for="currency">
                <span class="icon-line"
                  ><app-icon name="money" /> {{ i18n.t('add.currencyLabel') }}</span
                >
                <select id="currency" [formField]="addForm.currency">
                  @for (code of currencies; track code) {
                    <option [value]="code">{{ code }}</option>
                  }
                </select>
              </label>
            }
            <label for="due">
              <span class="icon-line"><app-icon name="calendar" /> {{ duePrompt() }}</span>
              <input id="due" type="date" [formField]="addForm.dueOn" />
            </label>
            <details>
              <summary><app-icon name="more" /> {{ i18n.t('add.more') }}</summary>
              <label>
                <span class="icon-line"
                  ><app-icon name="note" /> {{ i18n.t('add.noteLabel') }}</span
                >
                <textarea rows="2" [formField]="addForm.note"></textarea>
              </label>
            </details>
            @if (error()) {
              <p class="error icon-line" role="alert"><app-icon name="warning" /> {{ error() }}</p>
            }
            @if (draftStatus() === 'saving') {
              <p class="draft-status" role="status" aria-live="polite">
                {{ i18n.t('add.draftSaving') }}
              </p>
            } @else if (draftStatus() === 'saved') {
              <p class="draft-status" role="status" aria-live="polite">
                {{ i18n.t('add.draftSaved') }}
              </p>
            } @else if (draftStatus() === 'error') {
              <p class="draft-status error" role="alert">
                {{ i18n.t('add.draftError') }}
              </p>
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
      }
    </section>
  `,
})
export class AddPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pendingTasks = inject(PendingTasks);

  private readonly formModel = signal<AddRecordFormModel>({
    direction: 'lent',
    kind: 'physical_item',
    personName: '',
    personId: null,
    itemName: '',
    amount: '',
    currency: 'EUR',
    dueOn: '',
    note: '',
  });
  protected readonly addForm = form(this.formModel, (record) => {
    required(record.personName, { message: this.i18n.t('add.personRequired') });
    maxLength(record.personName, 120);
    required(record.itemName, {
      message: this.i18n.t('add.itemRequired'),
      when: ({ valueOf }) => valueOf(record.kind) === 'physical_item',
    });
    hidden(record.itemName, {
      when: ({ valueOf }) => valueOf(record.kind) === 'money',
    });
    maxLength(record.itemName, 200);
    required(record.amount, {
      message: this.i18n.t('add.amountRequired'),
      when: ({ valueOf }) => valueOf(record.kind) === 'money',
    });
    hidden(record.amount, {
      when: ({ valueOf }) => valueOf(record.kind) === 'physical_item',
    });
    maxLength(record.amount, 80);
    maxLength(record.note, 4000);
  });
  protected readonly direction = this.addForm.direction().value;
  protected readonly kind = this.addForm.kind().value;
  protected readonly personName = this.addForm.personName().value;
  protected readonly personId = this.addForm.personId().value;
  protected readonly itemName = this.addForm.itemName().value;
  protected readonly amount = this.addForm.amount().value;
  protected readonly currency = this.addForm.currency().value;
  protected readonly dueOn = this.addForm.dueOn().value;
  protected readonly note = this.addForm.note().value;
  protected readonly busy = this.addForm().submitting;
  protected readonly error = signal('');
  protected readonly initializing = signal(true);
  protected readonly initializationError = signal('');
  protected readonly draftStatus = signal<DraftStatus>('idle');
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
  private initializationVersion = 0;
  private latestDraftPersistence: Promise<unknown> | undefined;

  constructor() {
    this.pendingTasks.run(() => this.loadForm());
    effect((onCleanup) => {
      const draft = this.formModel();
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
        this.draftStatus.set('saving');
        this.latestDraftPersistence = persistence;
        void persistence.then(
          () => {
            if (this.latestDraftPersistence === persistence) {
              this.draftStatus.set(hasUserContent ? 'saved' : 'idle');
            }
          },
          () => {
            if (this.latestDraftPersistence === persistence) {
              this.draftStatus.set('error');
            }
          },
        );
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
    const version = ++this.initializationVersion;
    this.initializing.set(true);
    this.initializationError.set('');
    this.draftReady.set(false);
    this.draftStatus.set('idle');

    try {
      const [settings, people, draft] = await Promise.all([
        this.app.settings(),
        this.app.people(),
        this.app.recordDraft(),
      ]);
      if (version !== this.initializationVersion) {
        return;
      }

      this.people.set(people);
      if (draft) {
        this.formModel.set({
          direction: draft.direction,
          kind: draft.kind,
          personName: draft.personName,
          personId: draft.personId,
          itemName: draft.itemName,
          amount: draft.amount,
          currency: draft.currency,
          dueOn: draft.dueOn,
          note: draft.note,
        });
      } else {
        this.formModel.update((model) => ({ ...model, currency: settings.preferredCurrency }));
      }
      const linkedPersonId = this.route.snapshot.queryParamMap.get('personId');
      const linkedPerson = people.find((person) => person.id === linkedPersonId);
      if (linkedPerson) {
        this.choosePerson(linkedPerson);
      }
      this.draftReady.set(true);
    } catch {
      if (version === this.initializationVersion) {
        this.initializationError.set(this.i18n.t('add.loadError'));
      }
    } finally {
      if (version === this.initializationVersion) {
        this.initializing.set(false);
      }
    }
  }

  protected retryInitialization(): void {
    this.pendingTasks.run(() => this.loadForm());
  }

  protected updatePersonName(value: string): void {
    const selected = this.people().find((person) => person.id === this.personId());
    if (selected && selected.displayName !== value) {
      this.personId.set(null);
    }
    this.personName.set(value);
  }

  protected choosePerson(person: Person): void {
    this.personName.set(person.displayName);
    this.personId.set(person.id);
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    this.error.set('');
    try {
      await submit(this.addForm, {
        action: async (field) => {
          const model = field().value();
          const loan = await this.app.createRecord({
            direction: model.direction,
            kind: model.kind,
            personName: model.personName,
            personId: model.personId ?? undefined,
            itemName: model.itemName,
            amount: model.amount,
            currency: model.currency,
            dueOn: model.dueOn || null,
            note: model.note || null,
          });
          this.draftReady.set(false);
          if (this.draftTimer) {
            clearTimeout(this.draftTimer);
            this.draftTimer = undefined;
          }
          const pendingDraft = this.latestDraftPersistence;
          this.latestDraftPersistence = undefined;
          await pendingDraft?.catch(() => undefined);
          await this.app.clearRecordDraft();
          this.draftStatus.set('idle');
          await this.router.navigate(['/loans', loan.id]);
          return undefined;
        },
        onInvalid: () => {
          for (const field of [
            this.addForm.personName,
            this.addForm.itemName,
            this.addForm.amount,
          ]) {
            if (field().invalid()) {
              field().focusBoundControl();
              break;
            }
          }
        },
      });
    } catch (caught) {
      if (caught instanceof DomainError) {
        this.error.set(this.i18n.t(`errors.${caught.code}`));
      } else {
        this.error.set(this.i18n.t('add.error'));
      }
    }
  }
}
