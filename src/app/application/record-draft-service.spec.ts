import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from '../data/dexie-store';
import {
  RecordDraftService,
  type DraftPersistenceStatus,
  type RecordDraftInput,
} from './record-draft-service';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

const draft: RecordDraftInput = {
  direction: 'borrowed',
  kind: 'money',
  personName: 'Anna',
  personId: null,
  itemName: '',
  amount: '25',
  currency: 'EUR',
  dueOn: '',
  note: '',
};

describe('RecordDraftService', () => {
  it('publishes the status contract and owns draft load, save and clear', async () => {
    const statuses: readonly DraftPersistenceStatus[] = ['idle', 'saving', 'saved', 'error'];
    const dbName = `borrowed-draft-service-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const drafts = new RecordDraftService(store, clock);

    try {
      await store.initialize(clock);
      expect(statuses).toHaveLength(4);
      expect(await drafts.load()).toBeUndefined();

      const saved = await drafts.save(draft);
      expect(saved).toEqual({
        ...draft,
        id: 'add-record',
        updatedAt: '2026-08-20T12:00:00.000Z',
      });
      expect(await drafts.load()).toEqual(saved);

      await drafts.clear();
      expect(await drafts.load()).toBeUndefined();
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
