import type {
  Loan,
  LoanEvent,
  LocalSettings,
  Person,
  RecordDraft,
  Repayment,
  SyncMutation,
} from '../domain/types';
import type {
  LoanEventRow,
  LoanRow,
  MutationRow,
  PersonRow,
  RepaymentRow,
  RecordDraftRow,
  SettingsRow,
} from './rows';
import {
  decodeLoanEventRow,
  decodeLoanRow,
  decodeMutationRow,
  decodePersonRow,
  decodeRecordDraftRow,
  decodeRepaymentRow,
  decodeSettingsRow,
} from './row-decoders';

export function personToRow(person: Person): PersonRow {
  return { ...person };
}

export function personFromRow(row: unknown): Person {
  return decodePersonRow(row);
}

export function loanToRow(loan: Loan): LoanRow {
  return {
    ...loan,
    originalMinorUnits:
      loan.originalMinorUnits === null ? null : loan.originalMinorUnits.toString(),
  };
}

export function loanFromRow(row: unknown): Loan {
  return decodeLoanRow(row);
}

export function repaymentToRow(repayment: Repayment): RepaymentRow {
  return { ...repayment, minorUnits: repayment.minorUnits.toString() };
}

export function repaymentFromRow(row: unknown): Repayment {
  return decodeRepaymentRow(row);
}

export function eventToRow(event: LoanEvent): LoanEventRow {
  return {
    id: event.id,
    loanId: event.loanId,
    type: event.type,
    summaryKey: event.summaryKey,
    summaryParamsJson: JSON.stringify(event.summaryParams),
    occurredAt: event.occurredAt,
    createdAt: event.createdAt,
  };
}

export function eventFromRow(row: unknown): LoanEvent {
  return decodeLoanEventRow(row);
}

export function settingsToRow(settings: LocalSettings): SettingsRow {
  return { ...settings };
}

export function settingsFromRow(row: unknown): LocalSettings {
  return decodeSettingsRow(row);
}

export function mutationToRow(mutation: SyncMutation): MutationRow {
  return { ...mutation };
}

export function mutationFromRow(row: unknown): SyncMutation {
  return decodeMutationRow(row);
}

export function recordDraftToRow(draft: RecordDraft): RecordDraftRow {
  return { ...draft };
}

export function recordDraftFromRow(row: unknown): RecordDraft {
  return decodeRecordDraftRow(row);
}
