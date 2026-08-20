import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import type { Person } from '../../domain/types';

@Component({
  selector: 'app-people-page',
  imports: [EmptyState, RouterLink],
  template: `
    <section class="page">
      <h1>{{ i18n.t('people.title') }}</h1>
      @if (rows().length === 0) {
        <app-empty-state [message]="i18n.t('people.empty')" />
      } @else {
        <ul class="loan-list">
          @for (row of rows(); track row.person.id) {
            <li>
              <a class="loan-row" [routerLink]="['/people', row.person.id]">
                <span class="body">
                  <strong>{{ row.person.displayName }}</strong>
                  <span>{{ i18n.t('people.active', { count: row.activeCount }) }}</span>
                </span>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class PeoplePage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly rows = signal<{ person: Person; activeCount: number }[]>([]);

  constructor() {
    effect(() => {
      this.app.revision();
      void this.app.peopleWithCounts().then((value) => this.rows.set(value));
    });
  }
}
