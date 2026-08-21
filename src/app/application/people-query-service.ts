import { Injectable } from '@angular/core';
import { groupRepaymentsByLoan } from '../domain/loan-rules';
import {
  summarizePersonRelationships,
  type PersonRelationshipSummary,
} from '../domain/person-summary';
import type { Loan, Person } from '../domain/types';
import { BorrowedStore } from '../data/store';
import { CurrentDayService } from './current-day-service';

export interface PersonListRow {
  readonly person: Person;
  readonly activeCount: number;
  readonly lentActiveCount: number;
  readonly borrowedActiveCount: number;
  readonly historyCount: number;
}

export interface PersonOverview extends PersonRelationshipSummary {
  readonly person: Person | undefined;
}

@Injectable({ providedIn: 'root' })
export class PeopleQueryService {
  constructor(
    private readonly store: BorrowedStore,
    private readonly currentDay: CurrentDayService,
  ) {}

  async people(): Promise<Person[]> {
    const [people, loans] = await Promise.all([this.store.listPeople(), this.store.listLoans()]);
    return this.sortPeopleByRecent(people, loans);
  }

  async peopleWithCounts(): Promise<PersonListRow[]> {
    const [people, loans] = await Promise.all([this.store.listPeople(), this.store.listLoans()]);
    const activeCounts = new Map<string, number>();
    const lentActiveCounts = new Map<string, number>();
    const borrowedActiveCounts = new Map<string, number>();
    const historyCounts = new Map<string, number>();

    for (const loan of loans) {
      if (loan.status === 'active') {
        activeCounts.set(loan.personId, (activeCounts.get(loan.personId) ?? 0) + 1);
        const directionCounts = loan.direction === 'lent' ? lentActiveCounts : borrowedActiveCounts;
        directionCounts.set(loan.personId, (directionCounts.get(loan.personId) ?? 0) + 1);
      } else if (loan.status === 'completed') {
        historyCounts.set(loan.personId, (historyCounts.get(loan.personId) ?? 0) + 1);
      }
    }

    return this.sortPeopleByRecent(people, loans).map((person) => ({
      person,
      activeCount: activeCounts.get(person.id) ?? 0,
      lentActiveCount: lentActiveCounts.get(person.id) ?? 0,
      borrowedActiveCount: borrowedActiveCounts.get(person.id) ?? 0,
      historyCount: historyCounts.get(person.id) ?? 0,
    }));
  }

  loansForPerson(personId: string): Promise<Loan[]> {
    return this.store.listLoansForPerson(personId);
  }

  async personOverview(personId: string): Promise<PersonOverview> {
    const [person, loans] = await Promise.all([
      this.store.findPersonById(personId),
      this.store.listLoansForPerson(personId),
    ]);
    const repayments = await this.store.listRepaymentsForLoanIds(loans.map((loan) => loan.id));
    return {
      person,
      ...summarizePersonRelationships(
        loans,
        groupRepaymentsByLoan(repayments),
        this.currentDay.today(),
      ),
    };
  }

  private sortPeopleByRecent(people: readonly Person[], loans: readonly Loan[]): Person[] {
    const recent = new Map<string, string>();
    for (const loan of loans) {
      const previous = recent.get(loan.personId);
      if (!previous || loan.updatedAt > previous) {
        recent.set(loan.personId, loan.updatedAt);
      }
    }
    return [...people].sort((left, right) =>
      (recent.get(right.id) ?? '').localeCompare(recent.get(left.id) ?? ''),
    );
  }
}
