import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from '../data/dexie-store';
import { RecordsCommandService } from './records-command-service';
import { BackupService, type BackupImportPort } from './backup-service';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

describe('BackupService', () => {
  it('preserves current and raw exports while import remains an explicit future port', async () => {
    const dbName = `borrowed-backup-service-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const commands = new RecordsCommandService(store, clock);
    const backups = new BackupService(store, clock);
    const futureImporter: BackupImportPort = { importBackup: vi.fn() };

    try {
      await store.initialize(clock);
      const loan = await commands.createRecord({
        direction: 'lent',
        kind: 'money',
        personName: 'Peter',
        amount: '100',
        currency: 'EUR',
      });
      await commands.addRepayment(loan.id, '25', 'EUR');

      const exported: unknown = JSON.parse(await backups.exportJson());
      const raw: unknown = JSON.parse(await backups.exportRawRecoveryJson());
      const [people, loans, settings, repayments] = await Promise.all([
        store.listPeople(),
        store.listLoans(),
        store.getSettings(),
        store.listRepayments(),
      ]);

      expect(exported).toEqual({
        app: 'borrowed',
        exportedAt: '2026-08-20T12:00:00.000Z',
        settings: {
          preferredCurrency: settings.preferredCurrency,
          schemaVersion: settings.schemaVersion,
        },
        people,
        loans: loans.map((record) => ({
          ...record,
          originalMinorUnits: record.originalMinorUnits?.toString() ?? null,
        })),
        repayments: repayments.map((repayment) => ({
          ...repayment,
          minorUnits: repayment.minorUnits.toString(),
        })),
      });
      expect(raw).toMatchObject({
        kind: 'borrowed-local-recovery-diagnostic',
        exportedAt: '2026-08-20T12:00:00.000Z',
      });
      expect(futureImporter.importBackup).not.toHaveBeenCalled();
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
