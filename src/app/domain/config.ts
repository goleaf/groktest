/** Active loans due on today through today + this many days are "due soon". */
export const DUE_SOON_DAYS = 3;

export const DEFAULT_CURRENCY = 'EUR';

export const LOCAL_SETTINGS_ID = 'local';

export const APP_NAME = 'Borrowed';

/** Portable boundary for remote SQL BIGINT and native SQLite adapters. */
export const MAX_MINOR_UNITS = 9_223_372_036_854_775_807n;

export const INPUT_LIMITS = {
  personName: 120,
  itemName: 200,
  itemDescription: 2_000,
  note: 4_000,
  quantity: 1_000_000,
} as const;
