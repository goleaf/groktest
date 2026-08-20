import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../i18n/i18n';

@Component({
  selector: 'app-more-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      <h1>{{ i18n.t('more.title') }}</h1>
      <nav class="list-nav">
        <a routerLink="/history">{{ i18n.t('more.history') }}</a>
        <a routerLink="/people">{{ i18n.t('more.people') }}</a>
        <a routerLink="/settings">{{ i18n.t('more.settings') }}</a>
      </nav>
    </section>
  `,
})
export class MorePage {
  protected readonly i18n = inject(I18n);
}
