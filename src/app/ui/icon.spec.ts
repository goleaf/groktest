import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};

describe('Icon vocabulary', () => {
  it('contains the complete custody-board control vocabulary', () => {
    const source = processApi.process
      .getBuiltinModule('fs')
      .readFileSync(`${processApi.process.cwd()}/src/app/ui/icon.ts`, 'utf8');

    for (const name of ['records', 'filter', 'close', 'info']) {
      expect(source).toContain(`| '${name}'`);
      expect(source).toContain(`@case ('${name}')`);
    }
  });
});
