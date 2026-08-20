import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};

describe('native privacy configuration', () => {
  it('does not expose private local records to automatic Android backup', () => {
    const manifest = processApi.process
      .getBuiltinModule('fs')
      .readFileSync(`${processApi.process.cwd()}/android/app/src/main/AndroidManifest.xml`, 'utf8');
    expect(manifest).toContain('android:allowBackup="false"');
  });
});
