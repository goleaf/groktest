import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};
const source = processApi.process
  .getBuiltinModule('fs')
  .readFileSync(`${processApi.process.cwd()}/src/app/app.config.ts`, 'utf8');

describe('production application initializer', () => {
  it('initializes persistence, restores language, and limits demo records to development', () => {
    expect(source).toContain('initializeBorrowedApplication({');
    expect(source).toContain('app: inject(BorrowedApp)');
    expect(source).toContain('i18n: inject(I18n)');
    expect(source).toContain('state: inject(ApplicationInitializationState)');
    expect(source).toContain('development: isDevMode()');
    expect(source).toContain('seed: seedDemoIfEmpty');
  });

  it('registers the production service worker for an offline application shell', () => {
    expect(source).toContain("provideServiceWorker('ngsw-worker.js'");
    expect(source).toContain('enabled: !isDevMode() && !Capacitor.isNativePlatform()');
  });
});
