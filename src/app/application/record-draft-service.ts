import { Inject, Injectable } from '@angular/core';
import { instantFrom } from '../domain/calendar-date';
import type { DomainClock } from '../domain/commands';
import type { RecordDraft } from '../domain/types';
import { CLOCK } from '../data/clock';
import { BorrowedStore } from '../data/store';

export type RecordDraftInput = Omit<RecordDraft, 'id' | 'updatedAt'>;
export type DraftPersistenceStatus = 'idle' | 'saving' | 'saved' | 'error';

@Injectable({ providedIn: 'root' })
export class RecordDraftService {
  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
  ) {}

  load(): Promise<RecordDraft | undefined> {
    return this.store.getRecordDraft();
  }

  async save(draft: RecordDraftInput): Promise<RecordDraft> {
    const saved: RecordDraft = {
      ...draft,
      id: 'add-record',
      updatedAt: instantFrom(this.clock.now()),
    };
    await this.store.saveRecordDraft(saved);
    return saved;
  }

  clear(): Promise<void> {
    return this.store.clearRecordDraft();
  }
}
