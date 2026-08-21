import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18n } from '../i18n/i18n';
import { Icon } from '../ui/icon';
import { LanguageSwitcher } from '../ui/language-switcher';
import { CurrentDayTracker } from './current-day-tracker';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, LanguageSwitcher],
  template: `
    <div class="app-frame">
      <a class="skip-link" href="#main">{{ i18n.t('app.skipToContent') }}</a>
      <header class="app-header">
        <div class="header-inner">
          <a class="brand-link" routerLink="/" [attr.aria-label]="i18n.t('app.homeLabel')">
            <span class="brand-mark" aria-hidden="true"><app-icon name="brand" /></span>
            <span class="brand">{{ i18n.t('app.name') }}</span>
          </a>
          <nav class="desktop-nav" [attr.aria-label]="i18n.t('nav.workspaceLabel')">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <app-icon name="home" />
              <span>{{ i18n.t('nav.home') }}</span>
            </a>
            <a routerLink="/records" routerLinkActive="active">
              <app-icon name="records" />
              <span>{{ i18n.t('nav.records') }}</span>
            </a>
            <a routerLink="/people" routerLinkActive="active">
              <app-icon name="people" />
              <span>{{ i18n.t('nav.people') }}</span>
            </a>
            <a routerLink="/history" routerLinkActive="active">
              <app-icon name="history" />
              <span>{{ i18n.t('nav.history') }}</span>
            </a>
          </nav>
          <div class="header-tools">
            <a class="header-tool-link" routerLink="/search" routerLinkActive="active">
              <app-icon name="search" />
              <span>{{ i18n.t('nav.search') }}</span>
            </a>
            <a class="header-tool-link" routerLink="/settings" routerLinkActive="active">
              <app-icon name="settings" />
              <span>{{ i18n.t('nav.settings') }}</span>
            </a>
            <app-language-switcher [compact]="true" />
            <a class="header-add" routerLink="/add" [attr.aria-label]="i18n.t('nav.addRecord')">
              <app-icon name="add" />
              <span>{{ i18n.t('nav.addRecord') }}</span>
            </a>
          </div>
        </div>
      </header>
      <main id="main" class="main">
        <router-outlet />
      </main>
      <footer class="app-footer">
        <p class="presence">
          <app-icon name="device" />
          {{ i18n.t('app.onThisDevice') }}
        </p>
      </footer>
      <nav class="tabbar mobile-nav" [attr.aria-label]="i18n.t('nav.primaryLabel')">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <app-icon name="home" />
          <span>{{ i18n.t('nav.home') }}</span>
        </a>
        <a routerLink="/records" routerLinkActive="active">
          <app-icon name="records" />
          <span>{{ i18n.t('nav.records') }}</span>
        </a>
        <a routerLink="/add" routerLinkActive="active" class="add">
          <span class="add-mark" aria-hidden="true"><app-icon name="add" /></span>
          <span>{{ i18n.t('nav.add') }}</span>
        </a>
        <a routerLink="/search" routerLinkActive="active">
          <app-icon name="search" />
          <span>{{ i18n.t('nav.search') }}</span>
        </a>
        <a routerLink="/more" routerLinkActive="active">
          <app-icon name="more" />
          <span>
            {{ i18n.t('nav.more') }}
            <span class="sr-only"> {{ i18n.t('nav.moreContext') }}</span>
          </span>
        </a>
      </nav>
    </div>
  `,
})
export class Shell {
  protected readonly i18n = inject(I18n);

  constructor() {
    inject(CurrentDayTracker);
  }
}
