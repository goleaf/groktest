import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-more-page',
  imports: [RouterLink, Icon, PageHeading],
  template: `
    <section class="page">
      <app-page-heading icon="more" [title]="i18n.t('more.title')" [intro]="i18n.t('more.intro')" />
      <section class="more-group" aria-labelledby="records-tools-title">
        <h2 id="records-tools-title" class="section-heading">
          <app-icon name="records" />
          {{ i18n.t('more.yourRecords') }}
        </h2>
        <nav class="list-nav">
          <a routerLink="/people">
            <app-icon name="people" />
            <span>{{ i18n.t('more.people') }}</span>
            <app-icon name="chevron" />
          </a>
          <a routerLink="/history">
            <app-icon name="history" />
            <span>{{ i18n.t('more.history') }}</span>
            <app-icon name="chevron" />
          </a>
          <a routerLink="/settings">
            <app-icon name="settings" />
            <span>{{ i18n.t('more.settings') }}</span>
            <app-icon name="chevron" />
          </a>
        </nav>
      </section>
      <aside class="local-data-note">
        <app-icon name="device" />
        <div>
          <strong>{{ i18n.t('app.onThisDevice') }}</strong>
          <p>{{ i18n.t('more.localBody') }}</p>
        </div>
      </aside>
    </section>
  `,
})
export class MorePage {
  protected readonly i18n = inject(I18n);
}
