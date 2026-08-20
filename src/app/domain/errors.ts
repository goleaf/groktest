export type DomainErrorCode =
  | 'item_name_required'
  | 'quantity_invalid'
  | 'amount_not_positive'
  | 'currency_invalid'
  | 'amount_scale_invalid'
  | 'person_name_required'
  | 'not_money_loan'
  | 'not_physical_loan'
  | 'loan_not_active'
  | 'over_repayment'
  | 'currency_mismatch'
  | 'invalid_calendar_date'
  | 'invalid_direction'
  | 'invalid_asset_kind';

export class DomainError extends Error {
  constructor(readonly code: DomainErrorCode) {
    super(code);
    this.name = 'DomainError';
  }
}
