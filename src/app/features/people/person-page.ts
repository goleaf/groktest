import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan, Person } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-person-page',
  imports: [LoanRow, RouterLink],
  template: `
    <section class="page">
      <a routerLink="/people" class="back">{{ i18n.t('nav.back') }}</a>
      @if (missing()) {
        <p>{{ i18n.t('person.missing') }}</p>
      } @else if (person(); as data) {
        <h1>{{ data.displayName }}</h1>
        <ul class="loan-list">
          @for (loan of loans(); track loan.id) {
            <li><app-loan-row [loan]="loan" /></li>
          }
        </ul>
      }
    </section>
  `,
})
export class PersonPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly route = inject(ActivatedRoute);
  protected readonly person = signal<Person | null>(null);
  protected readonly loans = signal<Loan[]>([]);
  protected readonly missing = signal(false);

  constructor() {
    effect(() => {
      this.app.revision();
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.missing.set(true);
        return;
      }
      void Promise.all([this.app.people(), this.app.loansForPerson(id)]).then(([people, loans]) => {
        const found = people.find((item) => item.id === id) ?? null;
        this.person.set(found);
        this.loans.set(loans);
        this.missing.set(!found);
      });
    });
  }
}
