import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};
const styles = processApi.process
  .getBuiltinModule('fs')
  .readFileSync(`${processApi.process.cwd()}/src/styles.scss`, 'utf8');

describe('design system contract', () => {
  it('frames the work surface with explicit mobile and desktop navigation', () => {
    expect(styles).toContain('@media (min-width: 880px)');
    expect(styles).toContain('grid-template-columns: 248px minmax(0, 1fr)');
    expect(styles).toContain('.mobile-nav');
    expect(styles).toContain('.rail-nav');
    expect(styles).toMatch(/\.main\s*\{[^}]*grid-column:\s*2/s);
  });

  it('defines the flat custody-board palette and accessible interaction defaults', () => {
    for (const token of ['--canvas', '--paper', '--chrome', '--mint', '--action', '--overdue']) {
      expect(styles).toContain(token);
    }
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toMatch(/min-height:\s*(44|48|52)px/);
    expect(styles).toMatch(/\.search-field:focus-within\s*\{[^}]*outline:\s*3px\s+solid/s);
  });

  it('avoids gradients, decorative glass, and wide ghost-card shadows', () => {
    expect(styles).not.toContain('background-clip: text');
    expect(styles).not.toContain('backdrop-filter');
    expect(styles).not.toContain('linear-gradient(');
    expect(styles).not.toContain('radial-gradient(');
    expect(styles).not.toMatch(/box-shadow:\s*[^;]*\s(1[6-9]|[2-9]\d)px/);
  });

  it('defines one responsive semantic icon language across hierarchy and controls', () => {
    for (const selector of [
      '.page-heading',
      '.heading-icon',
      '.control-icon',
      '.empty-icon',
      '.status-with-icon',
      '.icon-link',
    ]) {
      expect(styles).toContain(selector);
    }
    expect(styles).toMatch(/\.heading-icon\s*\{[^}]*width:\s*40px[^}]*height:\s*40px/s);
    expect(styles).toMatch(/\.status-with-icon\s*\{[^}]*min-width:\s*0/s);
    expect(styles).toMatch(/\.status-with-icon app-icon\s*\{[^}]*flex:\s*0 0 auto/s);
  });
});
