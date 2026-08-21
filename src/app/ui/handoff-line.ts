import { Component, computed, inject, input } from '@angular/core';
import type { LoanDirection } from '../domain/types';
import { I18n } from '../i18n/i18n';
import { Icon } from './icon';

@Component({
  selector: 'app-handoff-line',
  imports: [Icon],
  template: `
    <span class="handoff-line" [attr.aria-label]="accessibleLabel()">
      <strong>{{ from() }}</strong>
      <span class="handoff-arrow" aria-hidden="true">
        <span></span>
        <app-icon name="chevron" />
      </span>
      <strong>{{ to() }}</strong>
    </span>
  `,
})
export class HandoffLine {
  readonly direction = input.required<LoanDirection>();
  readonly personName = input.required<string>();
  private readonly i18n = inject(I18n);

  protected readonly from = computed(() =>
    this.direction() === 'lent' ? this.i18n.t('handoff.you') : this.personName(),
  );
  protected readonly to = computed(() =>
    this.direction() === 'lent' ? this.personName() : this.i18n.t('handoff.you'),
  );
  protected readonly accessibleLabel = computed(() =>
    this.i18n.t(
      this.direction() === 'lent' ? 'handoff.lentAccessible' : 'handoff.borrowedAccessible',
      { person: this.personName() },
    ),
  );
}
