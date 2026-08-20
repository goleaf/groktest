import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideBorrowedPersistence } from './data/borrowed-app';
import { BorrowedApp } from './data/borrowed-app';
import { browserClock, CLOCK } from './data/clock';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: CLOCK, useFactory: browserClock },
    ...provideBorrowedPersistence(),
    provideAppInitializer(() => inject(BorrowedApp).initialize()),
  ],
};
