import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      existsSync(path: string): boolean;
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};

describe('PageHeading', () => {
  it('defines the shared semantic icon, title and introduction structure', () => {
    const file = `${processApi.process.cwd()}/src/app/ui/page-heading.ts`;
    const fs = processApi.process.getBuiltinModule('fs');
    const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

    expect(source).toContain("selector: 'app-page-heading'");
    expect(source).toContain('<app-icon [name]="icon()" />');
    expect(source).toContain('<h1>{{ title() }}</h1>');
    expect(source).toContain("readonly intro = input('')");
  });
});
