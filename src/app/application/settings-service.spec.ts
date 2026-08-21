import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from '../data/dexie-store';
import { SettingsService } from './settings-service';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

describe('SettingsService', () => {
  it('owns stable local identity access and versioned preference changes', async () => {
    const dbName = `borrowed-settings-service-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const settings = new SettingsService(store, clock);

    try {
      const initialized = await settings.initialize();
      const currency = await settings.setPreferredCurrency('GBP');
      const language = await settings.setPreferredLanguage('lt');

      expect(await settings.localIdentityId()).toBe(initialized.localIdentityId);
      expect(currency.preferredCurrency).toBe('GBP');
      expect(currency.version).toBe(initialized.version + 1);
      expect(language.preferredLanguage).toBe('lt');
      expect(language.version).toBe(initialized.version + 2);
      expect(await settings.get()).toEqual(language);

      await store.close();
      const reloadedStore = new DexieBorrowedStore(dbName);
      const reloaded = new SettingsService(reloadedStore, clock);
      expect((await reloaded.initialize()).localIdentityId).toBe(initialized.localIdentityId);
      expect((await reloaded.get()).preferredLanguage).toBe('lt');
      await reloadedStore.close();
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
