import { Injectable } from '@angular/core';
import { summarizeHome } from '../domain/home-summary';
import { groupRepaymentsByLoan } from '../domain/loan-rules';
import type { HomeSummary } from '../domain/types';
import { BorrowedStore } from '../data/store';
import { CurrentDayService } from './current-day-service';

@Injectable({ providedIn: 'root' })
export class HomeQueryService {
  constructor(
    private readonly store: BorrowedStore,
    private readonly currentDay: CurrentDayService,
  ) {}

  async home(): Promise<HomeSummary> {
    const [loans, repayments] = await Promise.all([
      this.store.listLoans(),
      this.store.listRepayments(),
    ]);
    return summarizeHome(loans, groupRepaymentsByLoan(repayments), this.currentDay.today());
  }
}
