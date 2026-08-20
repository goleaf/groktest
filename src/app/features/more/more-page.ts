import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';

@Component({
  selector: 'app-more-page',
  imports: [RouterLink, Icon],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ i18n.t('more.title') }}</h1>
          <p class="page-intro">{{ i18n.t('more.intro') }}</p>
        </div>
      </header>
      <section class="more-group" aria-labelledby="records-tools-title">
        <h2 id="records-tools-title">{{ i18n.t('more.yourRecords') }}</h2>
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
