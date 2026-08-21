import { Injectable, signal } from '@angular/core';

/** Temporary invalidation marker until Stage 1 query services replace global revision reads. */
@Injectable({ providedIn: 'root' })
export class ApplicationRevision {
  private readonly revision = signal(0);
  readonly value = this.revision.asReadonly();

  touch(): void {
    this.revision.update((value) => value + 1);
  }
}
