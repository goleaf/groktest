import { Injectable, signal } from '@angular/core';
import { SettingsService } from './application/settings-service';
import type { DomainClock } from './domain/commands';
import { BorrowedApp } from './data/borrowed-app';
import { PersistenceCorruptionError } from './data/persistence-corruption';
import { seedDemoIfEmpty } from './data/seed';
import { I18n } from './i18n/i18n';

@Injectable({ providedIn: 'root' })
export class ApplicationInitializationState {
  private readonly failureState = signal<ApplicationInitializationFailure | null>(null);
  private readonly retryingState = signal(false);
  private retryAction: (() => Promise<void>) | null = null;
  private retryInFlight: Promise<void> | null = null;
  readonly failure = this.failureState.asReadonly();
  readonly retrying = this.retryingState.asReadonly();

  reportFailure(kind: ApplicationInitializationFailureKind): void {
    this.failureState.update((current) => ({
      kind,
      attempt: (current?.attempt ?? 0) + 1,
    }));
  }

  reportReady(): void {
    this.failureState.set(null);
  }

  registerRetry(action: () => Promise<void>): void {
    this.retryAction = action;
  }

  retry(): Promise<void> {
    if (this.retryInFlight) {
      return this.retryInFlight;
    }
    if (!this.failureState() || !this.retryAction) {
      return Promise.resolve();
    }

    this.retryingState.set(true);
    const inFlight = this.retryAction().finally(() => {
      this.retryingState.set(false);
      this.retryInFlight = null;
    });
    this.retryInFlight = inFlight;
    return inFlight;
  }
}

export type ApplicationInitializationFailureKind = 'corruption' | 'unavailable';

export interface ApplicationInitializationFailure {
  readonly kind: ApplicationInitializationFailureKind;
  readonly attempt: number;
}

type DemoSeeder = (app: BorrowedApp, clock: DomainClock) => Promise<void>;

export interface BorrowedApplicationInitialization {
  readonly app: BorrowedApp;
  readonly settings: SettingsService;
  readonly i18n: I18n;
  readonly clock: DomainClock;
  readonly state: ApplicationInitializationState;
  readonly development: boolean;
  readonly seed?: DemoSeeder;
  readonly fallbackLanguage?: string;
}

const INDEXED_DB_FAILURE_NAMES = new Set([
  'AbortError',
  'BulkError',
  'ConstraintError',
  'DatabaseClosedError',
  'DataCloneError',
  'DataError',
  'InternalError',
  'InvalidAccessError',
  'InvalidStateError',
  'MissingAPIError',
  'ModifyError',
  'NoSuchDatabaseError',
  'NotFoundError',
  'OpenFailedError',
  'PrematureCommitError',
  'QuotaExceededError',
  'ReadOnlyError',
  'SchemaError',
  'TimeoutError',
  'TransactionInactiveError',
  'UnknownError',
  'UnsupportedError',
  'UpgradeError',
  'VersionChangeError',
  'VersionError',
]);

function initializationFailureKind(error: unknown): ApplicationInitializationFailureKind | null {
  if (error instanceof PersistenceCorruptionError) {
    return 'corruption';
  }
  if (error instanceof DOMException) {
    return 'unavailable';
  }
  return error instanceof Error && INDEXED_DB_FAILURE_NAMES.has(error.name) ? 'unavailable' : null;
}

async function attemptInitialization(
  input: BorrowedApplicationInitialization,
  allowDevelopmentSeed: boolean,
): Promise<void> {
  try {
    const settings = await input.settings.initialize();
    input.i18n.setLanguage(settings.preferredLanguage);
    if (allowDevelopmentSeed) {
      await (input.seed ?? seedDemoIfEmpty)(input.app, input.clock);
    }
    input.state.reportReady();
  } catch (error: unknown) {
    const failureKind = initializationFailureKind(error);
    if (!failureKind) {
      throw error;
    }
    input.state.reportFailure(failureKind);
  }
}

export async function initializeBorrowedApplication(
  input: BorrowedApplicationInitialization,
): Promise<void> {
  const fallbackLanguage =
    input.fallbackLanguage ?? (typeof navigator === 'undefined' ? undefined : navigator.language);
  if (fallbackLanguage) {
    input.i18n.setLanguage(fallbackLanguage);
  }
  input.state.registerRetry(() => attemptInitialization(input, false));
  await attemptInitialization(input, input.development);
}
