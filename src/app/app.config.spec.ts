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
  it('initializes persistence without injecting demo records', () => {
    expect(source).toContain('inject(BorrowedApp).initialize()');
    expect(source).not.toContain('seedDemoIfEmpty');
  });

  it('registers the production service worker for an offline application shell', () => {
    expect(source).toContain("provideServiceWorker('ngsw-worker.js'");
    expect(source).toContain('enabled: !isDevMode() && !Capacitor.isNativePlatform()');
  });
});
