export type PersistedEntity =
  | 'local_settings'
  | 'person'
  | 'loan'
  | 'repayment'
  | 'loan_event'
  | 'sync_mutation'
  | 'record_draft';

export type PersistenceCorruptionReason =
  | 'expected_object'
  | 'missing_property'
  | 'invalid_type'
  | 'invalid_value'
  | 'unsupported_version'
  | 'invalid_json'
  | 'out_of_range';

export class PersistenceCorruptionError extends Error {
  override readonly name = 'PersistenceCorruptionError';

  constructor(
    readonly entity: PersistedEntity,
    readonly path: string,
    readonly reason: PersistenceCorruptionReason,
    options?: ErrorOptions,
  ) {
    super(`Corrupt persisted ${entity} field ${path}: ${reason}`, options);
  }
}
