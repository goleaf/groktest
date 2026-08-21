import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { provideBorrowedPersistence } from './data/borrowed-app';
import { BorrowedApp } from './data/borrowed-app';
import { browserClock, CLOCK } from './data/clock';
import { routes } from './app.routes';
import { I18n } from './i18n/i18n';
import { seedDemoIfEmpty } from './data/seed';
import {
  ApplicationInitializationState,
  initializeBorrowedApplication,
} from './application-initialization';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: CLOCK, useFactory: browserClock },
    ...provideBorrowedPersistence(),
    provideAppInitializer(() =>
      initializeBorrowedApplication({
        app: inject(BorrowedApp),
        i18n: inject(I18n),
        clock: inject(CLOCK),
        state: inject(ApplicationInitializationState),
        development: isDevMode(),
        seed: seedDemoIfEmpty,
      }),
    ),
  ],
};
