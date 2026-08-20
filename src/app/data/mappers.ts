import type {
  Loan,
  LoanEvent,
  LocalSettings,
  Person,
  Repayment,
  SyncMutation,
} from '../domain/types';
import type {
  LoanEventRow,
  LoanRow,
  MutationRow,
  PersonRow,
  RepaymentRow,
  SettingsRow,
} from './rows';

export function personToRow(person: Person): PersonRow {
  return { ...person };
}

export function personFromRow(row: PersonRow): Person {
  return { ...row };
}

export function loanToRow(loan: Loan): LoanRow {
  return {
    ...loan,
    originalMinorUnits:
      loan.originalMinorUnits === null ? null : loan.originalMinorUnits.toString(),
  };
}

export function loanFromRow(row: LoanRow): Loan {
  return {
    ...row,
    originalMinorUnits: row.originalMinorUnits === null ? null : BigInt(row.originalMinorUnits),
  };
}

export function repaymentToRow(repayment: Repayment): RepaymentRow {
  return { ...repayment, minorUnits: repayment.minorUnits.toString() };
}

export function repaymentFromRow(row: RepaymentRow): Repayment {
  return { ...row, minorUnits: BigInt(row.minorUnits) };
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

export function eventFromRow(row: LoanEventRow): LoanEvent {
  return {
    id: row.id,
    loanId: row.loanId,
    type: row.type,
    summaryKey: row.summaryKey,
    summaryParams: JSON.parse(row.summaryParamsJson) as Record<string, string>,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

export function settingsToRow(settings: LocalSettings): SettingsRow {
  return { ...settings };
}

export function settingsFromRow(row: SettingsRow): LocalSettings {
  return { ...row };
}

export function mutationToRow(mutation: SyncMutation): MutationRow {
  return { ...mutation };
}

export function mutationFromRow(row: MutationRow): SyncMutation {
  return { ...row };
}
