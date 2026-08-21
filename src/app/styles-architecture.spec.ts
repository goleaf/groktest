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

const fileSystem = processApi.process.getBuiltinModule('fs');
const projectRoot = processApi.process.cwd();

const styleModules = [
  'tokens',
  'base',
  'shell',
  'primitives',
  'ledger',
  'home',
  'records',
  'supporting',
] as const;

const selectorKeys = (source: string): string[] => {
  const keys: string[] = [];
  const contexts: (string | null)[] = [];
  let prelude = '';

  for (const character of source.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (character === '{') {
      const value = prelude.trim();
      prelude = '';
      if (value.startsWith('@')) {
        contexts.push(value.replace(/\s+/g, ' '));
      } else {
        const selectors = value
          .split(',')
          .map((selector) => selector.trim().replace(/\s+/g, ' '))
          .sort()
          .join(',');
        keys.push(`${contexts.filter(Boolean).join('>')}|${selectors}`);
        contexts.push(null);
      }
      continue;
    }

    if (character === '}') {
      contexts.pop();
      prelude = '';
      continue;
    }

    prelude += character;
  }

  return keys;
};

describe('SCSS architecture', () => {
  it('keeps the global entrypoint as an ordered Sass module manifest', () => {
    const entrypoint = fileSystem.readFileSync(`${projectRoot}/src/styles.scss`, 'utf8');

    for (const moduleName of styleModules) {
      expect(fileSystem.existsSync(`${projectRoot}/src/styles/_${moduleName}.scss`)).toBe(true);
    }

    expect(entrypoint.trim()).toBe(
      styleModules.map((moduleName) => `@use 'styles/${moduleName}';`).join('\n'),
    );
  });

  it('does not ship selectors from the superseded pre-ledger interface', () => {
    const source = styleModules
      .map((moduleName) =>
        fileSystem.readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8'),
      )
      .join('\n');
    const legacyClasses = [
      'action-copy',
      'action-list',
      'app-navigation',
      'attention-band',
      'attention-copy',
      'attention-meta',
      'direction-links',
      'glance-list',
      'ghost',
      'home-aside',
      'lead-chevron',
      'lead-inline-action',
      'lead-record',
      'lead-record-icon',
      'mobile-presence',
      'overdue-glance',
      'overdue-line',
      'pill',
      'rail-add',
      'rail-nav',
      'rail-presence',
      'status-line',
      'topbar',
    ];

    for (const className of legacyClasses) {
      expect(
        new RegExp(`\\.${className}(?![a-zA-Z0-9_-])`).test(source),
        `legacy .${className}`,
      ).toBe(false);
    }
  });

  it('declares each selector list once in each cascade context', () => {
    const keys = styleModules.flatMap((moduleName) =>
      selectorKeys(
        fileSystem.readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8'),
      ),
    );
    const repeatedKeys = [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];

    expect(repeatedKeys).toEqual([]);
  });

  it('keeps only the winning declaration for each property in a rule', () => {
    const repeatedProperties = styleModules.flatMap((moduleName) => {
      const source = fileSystem
        .readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((match) => {
        const properties = [...match[2].matchAll(/^\s*([-\w]+)\s*:/gm)].map(
          (propertyMatch) => propertyMatch[1],
        );
        const repeated = [
          ...new Set(
            properties.filter((property, index) => properties.indexOf(property) !== index),
          ),
        ];

        return repeated.map((property) => `${moduleName}:${match[1].trim()}:${property}`);
      });
    });

    expect(repeatedProperties).toEqual([]);
  });

  it('reserves important declarations for the reduced-motion override', () => {
    const importantDeclarations = styleModules
      .flatMap((moduleName) =>
        fileSystem
          .readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8')
          .split('\n'),
      )
      .map((line) => line.trim())
      .filter((line) => line.includes('!important'));

    expect(importantDeclarations).toEqual([
      'scroll-behavior: auto !important;',
      'transition-duration: 0.01ms !important;',
      'animation-duration: 0.01ms !important;',
      'animation-iteration-count: 1 !important;',
    ]);
  });

  it('groups each media condition once per Sass module', () => {
    const repeatedMedia = styleModules.flatMap((moduleName) => {
      const source = fileSystem.readFileSync(
        `${projectRoot}/src/styles/_${moduleName}.scss`,
        'utf8',
      );
      const conditions = [...source.matchAll(/@media\s+([^{}]+)\{/g)].map((match) =>
        match[1].trim().replace(/\s+/g, ' '),
      );

      return [
        ...new Set(
          conditions
            .filter((condition, index) => conditions.indexOf(condition) !== index)
            .map((condition) => `${moduleName}:${condition}`),
        ),
      ];
    });

    expect(repeatedMedia).toEqual([]);
  });

  it('uses the canonical semantic token vocabulary without compatibility aliases', () => {
    const source = styleModules
      .map((moduleName) =>
        fileSystem.readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8'),
      )
      .join('\n');
    const retiredTokens = [
      '--paper',
      '--chrome',
      '--chrome-raised',
      '--chrome-text',
      '--mint',
      '--mint-strong',
      '--action',
      '--action-hover',
      '--action-soft',
      '--success',
    ];

    for (const token of retiredTokens) {
      expect(source.includes(token), `retired ${token}`).toBe(false);
    }
  });

  it('expresses responsive boundaries in rem units', () => {
    const pixelMedia = styleModules.flatMap((moduleName) => {
      const source = fileSystem.readFileSync(
        `${projectRoot}/src/styles/_${moduleName}.scss`,
        'utf8',
      );

      return [...source.matchAll(/@media\s+([^{}]+)\{/g)]
        .map((match) => match[1].trim())
        .filter((condition) => /\d(?:\.\d+)?px/.test(condition))
        .map((condition) => `${moduleName}:${condition}`);
    });

    expect(pixelMedia).toEqual([]);
  });

  it('keeps the desktop shell in the same single-column application grid', () => {
    const source = fileSystem.readFileSync(`${projectRoot}/src/styles/_shell.scss`, 'utf8');
    const desktopStart = source.indexOf('@media (min-width: 70rem) {');
    const desktopEnd = source.indexOf('@media (width < 70rem) {');
    const desktopRules = source.slice(desktopStart, desktopEnd);

    expect(desktopStart).toBeGreaterThanOrEqual(0);
    expect(desktopEnd).toBeGreaterThan(desktopStart);
    expect(desktopRules).not.toMatch(/\.main\s*{[^}]*grid-(?:column|row)\s*:/s);
    expect(desktopRules).not.toMatch(/\.brand-link\s*{[^}]*width\s*:/s);
    expect(desktopRules).not.toMatch(/\.brand\s*{[^}]*font-size\s*:/s);
  });

  it('does not erase the active background from the mobile add destination', () => {
    const source = fileSystem.readFileSync(`${projectRoot}/src/styles/_shell.scss`, 'utf8');
    const addRule = source.match(/\.mobile-nav a\.add\s*{([^}]*)}/)?.[1] ?? '';

    expect(addRule).not.toMatch(/background\s*:/);
  });

  it('keeps the authored SCSS within the optimized source budget', () => {
    const paths = ['src/styles.scss', ...styleModules.map((name) => `src/styles/_${name}.scss`)];
    const totalBytes = paths.reduce(
      (bytes, path) =>
        bytes +
        new TextEncoder().encode(fileSystem.readFileSync(`${projectRoot}/${path}`, 'utf8')).length,
      0,
    );

    expect(totalBytes).toBeLessThanOrEqual(48_500);
  });
});
