import type { FactoryProvider } from '@angular/core';
import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { provideBorrowedPersistence } from './borrowed-app';
import { DexieBorrowedStore } from './dexie-store';
import { BorrowedStore } from './store';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

describe('production persistence provider', () => {
  it('keeps using the historical IndexedDB name so existing data stays visible', async () => {
    const provider = provideBorrowedPersistence().find(
      (candidate) =>
        typeof candidate === 'object' &&
        candidate !== null &&
        'provide' in candidate &&
        candidate.provide === BorrowedStore,
    ) as FactoryProvider | undefined;

    expect(provider?.useFactory).toBeTypeOf('function');
    const store = provider?.useFactory?.() as DexieBorrowedStore;
    await store.initialize(clock);

    const databaseNames = (await indexedDB.databases()).map((database) => database.name);
    expect(databaseNames).toContain('borrowed');
    expect(databaseNames).not.toContain('borrowed-app');

    await store.close();
    indexedDB.deleteDatabase('borrowed');
    indexedDB.deleteDatabase('borrowed-app');
  });
});
