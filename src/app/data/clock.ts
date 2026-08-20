import { InjectionToken } from '@angular/core';
import type { DomainClock } from '../domain/commands';

export const CLOCK = new InjectionToken<DomainClock>('DomainClock');

export function browserClock(): DomainClock {
  return {
    now: () => new Date(),
    timeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
}
