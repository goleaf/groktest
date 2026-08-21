import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { CurrentDayService } from '../application/current-day-service';
import { I18n } from '../i18n/i18n';
import { Icon } from '../ui/icon';
import { LanguageSwitcher } from '../ui/language-switcher';

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
            <a
              routerLink="/"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              <app-icon name="home" />
              <span>{{ i18n.t('nav.home') }}</span>
            </a>
            <a
              routerLink="/records"
              [class.active]="recordsActive()"
              [attr.aria-current]="recordsActive() ? 'page' : null"
            >
              <app-icon name="records" />
              <span>{{ i18n.t('nav.records') }}</span>
            </a>
            <a routerLink="/people" routerLinkActive="active" ariaCurrentWhenActive="page">
              <app-icon name="people" />
              <span>{{ i18n.t('nav.people') }}</span>
            </a>
            <a routerLink="/history" routerLinkActive="active" ariaCurrentWhenActive="page">
              <app-icon name="history" />
              <span>{{ i18n.t('nav.history') }}</span>
            </a>
          </nav>
          <div class="header-tools">
            <a
              class="header-tool-link"
              routerLink="/search"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
            >
              <app-icon name="search" />
              <span>{{ i18n.t('nav.search') }}</span>
            </a>
            <a
              class="header-tool-link"
              routerLink="/settings"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
            >
              <app-icon name="settings" />
              <span>{{ i18n.t('nav.settings') }}</span>
            </a>
            <app-language-switcher [compact]="true" />
            <a
              class="header-add"
              routerLink="/add"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              [attr.aria-label]="i18n.t('nav.addRecord')"
            >
              <app-icon name="add" />
              <span>{{ i18n.t('nav.addRecord') }}</span>
            </a>
          </div>
        </div>
      </header>
      <main #main id="main" class="main" tabindex="-1">
        <router-outlet />
      </main>
      <footer class="app-footer">
        <p class="presence">
          <app-icon name="device" />
          {{ i18n.t('app.onThisDevice') }}
        </p>
      </footer>
      <nav class="tabbar mobile-nav" [attr.aria-label]="i18n.t('nav.primaryLabel')">
        <a
          routerLink="/"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <app-icon name="home" />
          <span>{{ i18n.t('nav.home') }}</span>
        </a>
        <a
          routerLink="/records"
          [class.active]="recordsActive()"
          [attr.aria-current]="recordsActive() ? 'page' : null"
        >
          <app-icon name="records" />
          <span>{{ i18n.t('nav.records') }}</span>
        </a>
        <a routerLink="/add" routerLinkActive="active" ariaCurrentWhenActive="page" class="add">
          <span class="add-mark" aria-hidden="true"><app-icon name="add" /></span>
          <span>{{ i18n.t('nav.add') }}</span>
        </a>
        <a routerLink="/search" routerLinkActive="active" ariaCurrentWhenActive="page">
          <app-icon name="search" />
          <span>{{ i18n.t('nav.search') }}</span>
        </a>
        <a
          routerLink="/more"
          [class.active]="moreActive()"
          [attr.aria-current]="moreActive() ? 'page' : null"
        >
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
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  private readonly currentPath = computed(() => this.currentUrl().split(/[?#]/, 1)[0]);
  protected readonly recordsActive = computed(() =>
    this.matchesSection(['/records', '/lent', '/borrowed', '/loans']),
  );
  protected readonly moreActive = computed(() =>
    this.matchesSection(['/more', '/people', '/history', '/settings']),
  );

  constructor() {
    inject(CurrentDayService);
    effect(() => {
      this.currentUrl();
      let route = this.router.routerState.snapshot.root;
      while (route.firstChild) {
        route = route.firstChild;
      }
      const titleKey = route.data['titleKey'];
      const pageTitle = typeof titleKey === 'string' ? this.i18n.t(titleKey) : '';
      this.document.title = pageTitle
        ? `${pageTitle} · ${this.i18n.t('app.name')}`
        : this.i18n.t('app.name');
    });
    effect(() => {
      this.currentPath();
      const main = this.main();
      if (main) {
        queueMicrotask(() => main.nativeElement.focus());
      }
    });
  }

  private matchesSection(prefixes: readonly string[]): boolean {
    const path = this.currentPath();
    return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  }
}
