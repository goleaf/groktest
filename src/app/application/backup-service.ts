import { Inject, Injectable } from '@angular/core';
import { instantFrom } from '../domain/calendar-date';
import type { DomainClock } from '../domain/commands';
import { CLOCK } from '../data/clock';
import { BorrowedStore } from '../data/store';

/** Implemented only when a versioned, decoded and transactional restore contract exists. */
export interface BackupImportPort {
  importBackup(contents: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
  ) {}

  async exportJson(): Promise<string> {
    const [people, loans, settings, repayments] = await Promise.all([
      this.store.listPeople(),
      this.store.listLoans(),
      this.store.getSettings(),
      this.store.listRepayments(),
    ]);
    return JSON.stringify(
      {
        app: 'borrowed',
        exportedAt: instantFrom(this.clock.now()),
        settings: {
          preferredCurrency: settings.preferredCurrency,
          schemaVersion: settings.schemaVersion,
        },
        people,
        loans: loans.map((loan) => ({
          ...loan,
          originalMinorUnits: loan.originalMinorUnits?.toString() ?? null,
        })),
        repayments: repayments.map((repayment) => ({
          ...repayment,
          minorUnits: repayment.minorUnits.toString(),
        })),
      },
      null,
      2,
    );
  }

  exportRawRecoveryJson(): Promise<string> {
    return this.store.exportRawRecoveryJson(instantFrom(this.clock.now()));
  }
}
