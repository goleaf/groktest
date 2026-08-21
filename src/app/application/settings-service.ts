import { Inject, Injectable } from '@angular/core';
import { instantFrom } from '../domain/calendar-date';
import type { DomainClock } from '../domain/commands';
import { requireCurrency } from '../domain/money';
import type { LocalSettings, SupportedLanguage } from '../domain/types';
import { CLOCK } from '../data/clock';
import { BorrowedStore } from '../data/store';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
  ) {}

  initialize(): Promise<LocalSettings> {
    return this.store.initialize(this.clock);
  }

  get(): Promise<LocalSettings> {
    return this.store.getSettings();
  }

  async localIdentityId(): Promise<string> {
    return (await this.get()).localIdentityId;
  }

  async setPreferredCurrency(currency: string): Promise<LocalSettings> {
    const current = await this.get();
    const next: LocalSettings = {
      ...current,
      preferredCurrency: requireCurrency(currency),
      updatedAt: instantFrom(this.clock.now()),
      version: current.version + 1,
    };
    await this.store.saveSettings(next, this.clock);
    return next;
  }

  async setPreferredLanguage(language: SupportedLanguage): Promise<LocalSettings> {
    const current = await this.get();
    const next: LocalSettings = {
      ...current,
      preferredLanguage: language,
      updatedAt: instantFrom(this.clock.now()),
      version: current.version + 1,
    };
    await this.store.saveSettings(next, this.clock);
    return next;
  }
}
