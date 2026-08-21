import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};
const fileSystem = processApi.process.getBuiltinModule('fs');
const styles = [
  'src/styles.scss',
  'src/styles/_tokens.scss',
  'src/styles/_shell.scss',
  'src/styles/_ledger.scss',
  'src/styles/_records.scss',
]
  .map((path) => fileSystem.readFileSync(`${processApi.process.cwd()}/${path}`, 'utf8'))
  .join('\n');

describe('design system contract', () => {
  it('frames the work surface with a horizontal desktop header and mobile navigation', () => {
    expect(styles).toContain('@media (min-width: 70rem)');
    expect(styles).toContain('.app-header');
    expect(styles).toContain('.desktop-nav');
    expect(styles).toContain('.header-tools');
    expect(styles).toContain('.mobile-nav');
    expect(styles).toMatch(/\.header-inner\s*\{[^}]*max-width:\s*1320px/s);
  });

  it('defines the flat handoff-ledger palette and accessible interaction defaults', () => {
    expect(styles).toContain("@use 'styles/tokens'");
    for (const token of ['--canvas', '--surface', '--teal', '--teal-deep', '--ink', '--overdue']) {
      expect(styles).toContain(token);
    }
    expect(styles).toContain('oklch(0.48 0.11 188)');
    expect(styles).toContain('.handoff-line');
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

  it('bounds long record rendering and keeps phone filters horizontally reachable', () => {
    expect(styles).toMatch(/\.records-page \.loan-list > li\s*\{[^}]*content-visibility:\s*auto/s);
    expect(styles).toMatch(/\.records-page \.chips\s*\{[^}]*overflow-x:\s*auto/s);
    expect(styles).toMatch(/@media print\s*\{[^}]*content-visibility:\s*visible/s);
  });

  it('keeps form focus visible and reserves compact-shell scroll space', () => {
    expect(styles).toMatch(/\.app-frame input:focus-visible[^{]*\{[^}]*outline:\s*3px solid/s);
    expect(styles).toContain('scroll-padding-bottom: calc(76px + var(--safe-bottom))');
    expect(styles).toContain('.field-error');
  });
});
