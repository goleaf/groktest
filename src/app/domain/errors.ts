export type DomainErrorCode =
  | 'item_name_required'
  | 'quantity_invalid'
  | 'amount_not_positive'
  | 'currency_invalid'
  | 'amount_scale_invalid'
  | 'amount_too_large'
  | 'person_name_required'
  | 'person_name_too_long'
  | 'person_missing'
  | 'item_name_too_long'
  | 'item_description_too_long'
  | 'note_too_long'
  | 'not_money_loan'
  | 'not_physical_loan'
  | 'loan_not_active'
  | 'over_repayment'
  | 'currency_mismatch'
  | 'invalid_calendar_date'
  | 'date_order_invalid'
  | 'invalid_direction'
  | 'invalid_asset_kind';

export class DomainError extends Error {
  constructor(readonly code: DomainErrorCode) {
    super(code);
    this.name = 'DomainError';
  }
}
