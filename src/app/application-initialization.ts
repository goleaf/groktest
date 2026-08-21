import { Injectable, signal } from '@angular/core';
import type { DomainClock } from './domain/commands';
import { BorrowedApp } from './data/borrowed-app';
import { PersistenceCorruptionError } from './data/persistence-corruption';
import { seedDemoIfEmpty } from './data/seed';
import { I18n } from './i18n/i18n';

@Injectable({ providedIn: 'root' })
export class ApplicationInitializationState {
  private readonly corruptionState = signal<PersistenceCorruptionError | null>(null);
  readonly corruption = this.corruptionState.asReadonly();

  reportCorruption(error: PersistenceCorruptionError): void {
    this.corruptionState.set(error);
  }
}

type DemoSeeder = (app: BorrowedApp, clock: DomainClock) => Promise<void>;

export interface BorrowedApplicationInitialization {
  readonly app: BorrowedApp;
  readonly i18n: I18n;
  readonly clock: DomainClock;
  readonly state: ApplicationInitializationState;
  readonly development: boolean;
  readonly seed?: DemoSeeder;
}

export async function initializeBorrowedApplication(
  input: BorrowedApplicationInitialization,
): Promise<void> {
  try {
    const settings = await input.app.initialize();
    input.i18n.setLanguage(settings.preferredLanguage);
    if (input.development) {
      await (input.seed ?? seedDemoIfEmpty)(input.app, input.clock);
    }
  } catch (error: unknown) {
    if (error instanceof PersistenceCorruptionError) {
      input.state.reportCorruption(error);
      return;
    }
    throw error;
  }
}
