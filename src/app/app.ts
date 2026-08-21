import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackupService } from './application/backup-service';
import { ApplicationInitializationState } from './application-initialization';
import { I18n } from './i18n/i18n';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `
    @if (initialization.failure(); as failure) {
      <main #recoveryMain class="persistence-failure" tabindex="-1">
        <section
          class="recovery-panel"
          aria-labelledby="persistence-failure-title"
          [attr.aria-busy]="initialization.retrying() || exportBusy() ? 'true' : null"
        >
          <div role="alert">
            <p class="eyebrow">{{ i18n.t('app.localRecoveryEyebrow') }}</p>
            <h1 id="persistence-failure-title">{{ i18n.t('app.localRecoveryTitle') }}</h1>
            <p>
              {{
                i18n.t(
                  failure.kind === 'corruption'
                    ? 'app.localRecoveryCorruptionBody'
                    : 'app.localRecoveryUnavailableBody'
                )
              }}
            </p>
            <p class="detail">{{ i18n.t('app.localRecoveryUnchanged') }}</p>
          </div>

          <div
            class="recovery-actions"
            role="group"
            [attr.aria-label]="i18n.t('app.localRecoveryActionsLabel')"
          >
            <button
              class="button"
              data-recovery-action="retry"
              type="button"
              [attr.aria-disabled]="initialization.retrying() || exportBusy() ? 'true' : null"
              (click)="retryRecovery()"
            >
              {{
                i18n.t(
                  initialization.retrying() ? 'app.localRecoveryRetrying' : 'app.localRecoveryRetry'
                )
              }}
            </button>
            <button
              class="button secondary"
              data-recovery-action="export"
              type="button"
              aria-describedby="recovery-export-privacy"
              [attr.aria-disabled]="initialization.retrying() || exportBusy() ? 'true' : null"
              (click)="exportRecoveryData()"
            >
              {{ i18n.t(exportBusy() ? 'app.localRecoveryExporting' : 'app.localRecoveryExport') }}
            </button>
          </div>

          <p id="recovery-export-privacy" class="privacy-note">
            {{ i18n.t('app.localRecoveryExportPrivacy') }}
          </p>

          <section class="recovery-note" aria-labelledby="recovery-reset-title">
            <h2 id="recovery-reset-title">{{ i18n.t('app.localRecoveryResetTitle') }}</h2>
            <p>{{ i18n.t('app.localRecoveryResetBody') }}</p>
          </section>

          <div class="future-restore">
            <button
              class="button secondary"
              data-recovery-action="restore"
              type="button"
              aria-describedby="recovery-restore-detail"
              disabled
            >
              {{ i18n.t('app.localRecoveryRestore') }}
            </button>
            <p id="recovery-restore-detail">{{ i18n.t('app.localRecoveryRestoreUnavailable') }}</p>
          </div>

          <p class="recovery-feedback" role="status" aria-live="assertive">
            {{ feedback() }}
          </p>
        </section>
      </main>
    } @else {
      <router-outlet />
    }
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly initialization = inject(ApplicationInitializationState);
  protected readonly i18n = inject(I18n);
  private readonly backups = inject(BackupService);
  private readonly recoveryMain = viewChild<ElementRef<HTMLElement>>('recoveryMain');
  protected readonly exportBusy = signal(false);
  protected readonly feedback = signal('');
  private hasFocusedRecovery = false;

  constructor() {
    effect(() => {
      const failure = this.initialization.failure();
      const main = this.recoveryMain();
      if (!failure) {
        this.hasFocusedRecovery = false;
        return;
      }
      if (main && !this.hasFocusedRecovery) {
        main.nativeElement.focus();
        this.hasFocusedRecovery = true;
      }
    });
  }

  protected async retryRecovery(): Promise<void> {
    if (this.initialization.retrying() || this.exportBusy()) {
      return;
    }
    this.feedback.set('');
    try {
      await this.initialization.retry();
      if (this.initialization.failure()) {
        this.feedback.set(this.i18n.t('app.localRecoveryRetryFailed'));
      }
    } catch {
      this.feedback.set(this.i18n.t('app.localRecoveryRetryFailed'));
    }
  }

  protected async exportRecoveryData(): Promise<void> {
    if (this.initialization.retrying() || this.exportBusy()) {
      return;
    }

    this.exportBusy.set(true);
    this.feedback.set('');
    try {
      const json = await this.backups.exportRawRecoveryJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'borrowed-local-recovery.json';
      try {
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      this.feedback.set(this.i18n.t('app.localRecoveryExportSuccess'));
    } catch {
      this.feedback.set(this.i18n.t('app.localRecoveryExportFailed'));
    } finally {
      this.exportBusy.set(false);
    }
  }
}
