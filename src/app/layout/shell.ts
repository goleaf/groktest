import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18n } from '../i18n/i18n';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-frame">
      <header class="topbar">
        <p class="brand">{{ i18n.t('app.name') }}</p>
        <p class="presence">{{ i18n.t('app.onThisDevice') }}</p>
      </header>
      <main id="main" class="main">
        <router-outlet />
      </main>
      <nav class="tabbar" aria-label="Primary">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          {{ i18n.t('nav.home') }}
        </a>
        <a routerLink="/lent" routerLinkActive="active">{{ i18n.t('nav.lent') }}</a>
        <a routerLink="/add" routerLinkActive="active" class="add">{{ i18n.t('nav.add') }}</a>
        <a routerLink="/borrowed" routerLinkActive="active">{{ i18n.t('nav.borrowed') }}</a>
        <a routerLink="/more" routerLinkActive="active">{{ i18n.t('nav.more') }}</a>
      </nav>
    </div>
  `,
})
export class Shell {
  protected readonly i18n = inject(I18n);
}
