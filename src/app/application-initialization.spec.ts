import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from './domain/commands';
import type { LocalSettings } from './domain/types';
import { BorrowedApp } from './data/borrowed-app';
import { DexieBorrowedStore } from './data/dexie-store';
import { I18n } from './i18n/i18n';
import {
  ApplicationInitializationState,
  initializeBorrowedApplication,
} from './application-initialization';

const STORES = {
  people: 'id, displayName, deletedAt',
  loans: 'id, personId, direction, assetKind, status, occurredOn, dueOn, deletedAt',
  repayments: 'id, loanId, deletedAt',
  events: 'id, loanId',
  mutations: 'id, ackedAt, createdAt, entityId',
  settings: 'id',
  drafts: 'id',
} as const;

const clock: DomainClock = {
  now: () => new Date('2026-08-21T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

const lithuanianSettings: LocalSettings = {
  id: 'local',
  localIdentityId: 'identity-1',
  preferredCurrency: 'EUR',
  preferredLanguage: 'lt',
  schemaVersion: 3,
  version: 1,
  createdAt: '2026-08-21T12:00:00.000Z',
  updatedAt: '2026-08-21T12:00:00.000Z',
};

function unavailablePersistence(message = 'private persisted name: Aistė'): Error {
  const error = new Error(message);
  error.name = 'OpenFailedError';
  return error;
}

async function corruptSettingsDatabase(): Promise<string> {
  const dbName = `borrowed-initialization-${crypto.randomUUID()}`;
  const raw = new Dexie(dbName);
  raw.version(3).stores(STORES);
  await raw.open();
  await raw.table('settings').put({
    id: 'local',
    localIdentityId: 'identity-1',
    preferredCurrency: 'BTC',
    preferredLanguage: 'en',
    schemaVersion: 3,
    version: 1,
    createdAt: '2026-08-21T12:00:00.000Z',
    updatedAt: '2026-08-21T12:00:00.000Z',
  });
  raw.close();
  return dbName;
}

describe('application initialization corruption boundary', () => {
  it('reports a real corrupt IndexedDB settings row without rejecting Angular initialization', async () => {
    const dbName = await corruptSettingsDatabase();
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    const i18n = new I18n();
    const state = new ApplicationInitializationState();
    const seed = vi.fn(async () => undefined);

    await expect(
      initializeBorrowedApplication({ app, i18n, clock, state, development: true, seed }),
    ).resolves.toBeUndefined();

    expect(state.failure()).toEqual({
      kind: 'corruption',
      attempt: 1,
    });
    expect(seed).not.toHaveBeenCalled();

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('restores valid settings and runs the existing development seed', async () => {
    const dbName = `borrowed-initialization-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    const i18n = new I18n();
    const state = new ApplicationInitializationState();
    const seed = vi.fn(async () => undefined);

    await initializeBorrowedApplication({ app, i18n, clock, state, development: true, seed });

    expect(i18n.language()).toBe('en');
    expect(state.failure()).toBeNull();
    expect(seed).toHaveBeenCalledExactlyOnceWith(app, clock);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('reports recognized IndexedDB rejection without rejecting Angular initialization', async () => {
    const dbName = `borrowed-initialization-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    const failure = unavailablePersistence();
    vi.spyOn(app, 'initialize').mockRejectedValue(failure);
    const state = new ApplicationInitializationState();

    await expect(
      initializeBorrowedApplication({
        app,
        i18n: new I18n(),
        clock,
        state,
        development: false,
      }),
    ).resolves.toBeUndefined();
    expect(state.failure()).toEqual({ kind: 'unavailable', attempt: 1 });

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('retries initialization, restores language, and never seeds during recovery', async () => {
    const dbName = `borrowed-initialization-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    const initialize = vi
      .spyOn(app, 'initialize')
      .mockRejectedValueOnce(unavailablePersistence())
      .mockResolvedValueOnce(lithuanianSettings);
    const i18n = new I18n();
    const state = new ApplicationInitializationState();
    const seed = vi.fn(async () => undefined);

    await initializeBorrowedApplication({ app, i18n, clock, state, development: true, seed });
    await state.retry();

    expect(initialize).toHaveBeenCalledTimes(2);
    expect(state.failure()).toBeNull();
    expect(state.retrying()).toBe(false);
    expect(i18n.language()).toBe('lt');
    expect(seed).not.toHaveBeenCalled();

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('keeps repeated recovery failure usable and de-duplicates concurrent retry calls', async () => {
    const dbName = `borrowed-initialization-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    const initialize = vi.spyOn(app, 'initialize').mockRejectedValue(unavailablePersistence());
    const state = new ApplicationInitializationState();

    await initializeBorrowedApplication({
      app,
      i18n: new I18n(),
      clock,
      state,
      development: false,
    });
    const firstRetry = state.retry();
    const duplicateRetry = state.retry();
    await Promise.all([firstRetry, duplicateRetry]);

    expect(firstRetry).toBe(duplicateRetry);
    expect(initialize).toHaveBeenCalledTimes(2);
    expect(state.failure()).toEqual({ kind: 'unavailable', attempt: 2 });
    expect(state.retrying()).toBe(false);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('rethrows non-persistence failures unchanged', async () => {
    const dbName = `borrowed-initialization-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    const failure = new Error('programmer_failure');
    vi.spyOn(app, 'initialize').mockRejectedValue(failure);
    const state = new ApplicationInitializationState();

    await expect(
      initializeBorrowedApplication({
        app,
        i18n: new I18n(),
        clock,
        state,
        development: false,
      }),
    ).rejects.toBe(failure);
    expect(state.failure()).toBeNull();

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });
});
