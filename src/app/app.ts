import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApplicationInitializationState } from './application-initialization';
import { I18n } from './i18n/i18n';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `
    @if (initialization.corruption()) {
      <main class="persistence-failure">
        <section role="alert" aria-labelledby="persistence-failure-title">
          <p class="eyebrow">{{ i18n.t('app.dataCorruptionEyebrow') }}</p>
          <h1 id="persistence-failure-title">{{ i18n.t('app.dataCorruptionTitle') }}</h1>
          <p>{{ i18n.t('app.dataCorruptionBody') }}</p>
          <p class="detail">{{ i18n.t('app.dataCorruptionDetail') }}</p>
        </section>
      </main>
    } @else {
      <router-outlet />
    }
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly initialization = inject(ApplicationInitializationState);
  protected readonly i18n = inject(I18n);
}
