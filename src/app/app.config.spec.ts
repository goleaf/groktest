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
    expect(source).toContain('const app = inject(BorrowedApp)');
    expect(source).toContain('const settings = await app.initialize()');
    expect(source).toContain('i18n.setLanguage(settings.preferredLanguage)');
    expect(source).toContain('if (isDevMode())');
    expect(source).toContain('await seedDemoIfEmpty(app, clock)');
  });

  it('registers the production service worker for an offline application shell', () => {
    expect(source).toContain("provideServiceWorker('ngsw-worker.js'");
    expect(source).toContain('enabled: !isDevMode() && !Capacitor.isNativePlatform()');
  });
});
