import { Injectable } from '@angular/core';
import {
  compareLoansByAttention,
  groupRepaymentsByLoan,
  outstandingMinorUnits,
} from '../domain/loan-rules';
import type { ListFilter } from '../domain/query';
import { visibleLoans } from '../domain/query';
import type { Loan } from '../domain/types';
import { BorrowedStore, type LoanRecord } from '../data/store';
import { CurrentDayService } from './current-day-service';

export type RecordDetail = LoanRecord;

@Injectable({ providedIn: 'root' })
export class RecordsQueryService {
  constructor(
    private readonly store: BorrowedStore,
    private readonly currentDay: CurrentDayService,
  ) {}

  async activeLoans(direction?: 'lent' | 'borrowed'): Promise<Loan[]> {
    const today = this.currentDay.today();
    const loans = await this.store.listActiveLoans(direction);
    return loans.sort((left, right) => compareLoansByAttention(left, right, today));
  }

  async history(): Promise<Loan[]> {
    const loans = await this.store.listCompletedLoans();
    return loans.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  loanDetail(id: string): Promise<RecordDetail | undefined> {
    return this.store.loadLoanRecord(id);
  }

  async remainingFor(loan: Loan): Promise<bigint | null> {
    if (loan.assetKind !== 'money') {
      return null;
    }
    return outstandingMinorUnits(loan, await this.store.listRepayments(loan.id));
  }

  filterLoans(loans: readonly Loan[], query: string, filter: ListFilter): Loan[] {
    return visibleLoans(loans, query, filter, this.currentDay.today());
  }

  async remainingMap(loans: readonly Loan[]): Promise<ReadonlyMap<string, bigint | null>> {
    const moneyLoanIds = loans.filter((loan) => loan.assetKind === 'money').map((loan) => loan.id);
    const repaymentsByLoan = groupRepaymentsByLoan(
      await this.store.listRepaymentsForLoanIds(moneyLoanIds),
    );
    const remainingByLoan = new Map<string, bigint | null>();

    for (const loan of loans) {
      if (loan.assetKind !== 'money' || !loan.currencyCode || loan.originalMinorUnits === null) {
        remainingByLoan.set(loan.id, null);
        continue;
      }
      const remaining = outstandingMinorUnits(loan, repaymentsByLoan.get(loan.id) ?? []);
      remainingByLoan.set(loan.id, remaining === loan.originalMinorUnits ? null : remaining);
    }

    return remainingByLoan;
  }

  async search(query: string): Promise<Loan[]> {
    const loans = await this.store.listLoans();
    const today = this.currentDay.today();
    return visibleLoans(loans, query, 'all', today).sort((left, right) =>
      compareLoansByAttention(left, right, today),
    );
  }
}
