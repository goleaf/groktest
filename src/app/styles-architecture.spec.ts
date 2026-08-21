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

type StyleModule = (typeof styleModules)[number];

interface StyleRule {
  moduleName: StyleModule;
  context: string;
  selectors: string[];
  declarations: { property: string; value: string }[];
}

const matchingBraceIndex = (source: string, openingBraceIndex: number): number => {
  let depth = 0;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return source.length;
};

const styleRules = (moduleName: StyleModule): StyleRule[] => {
  const source = fileSystem
    .readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: StyleRule[] = [];
  const contexts: (string | null)[] = [];
  let prelude = '';

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (character === '{') {
      const value = prelude.trim();
      prelude = '';
      if (value.startsWith('@')) {
        contexts.push(value.replace(/\s+/g, ' '));
      } else {
        const selectors = value
          .split(',')
          .map((selector) => selector.trim().replace(/\s+/g, ' '))
          .filter(Boolean);
        const closingBraceIndex = matchingBraceIndex(source, index);
        const body = source.slice(index + 1, closingBraceIndex);
        const declarations = [...body.matchAll(/^\s*([-\w]+)\s*:\s*([^;{}]+);/gm)].map((match) => ({
          property: match[1],
          value: match[2].trim().replace(/\s+/g, ' '),
        }));

        rules.push({
          moduleName,
          context: contexts.filter(Boolean).join('>'),
          selectors,
          declarations,
        });
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

  return rules;
};

const allStyleRules = (): StyleRule[] => styleModules.flatMap(styleRules);

const splitCssValue = (value: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const character of value) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;

    if (/\s/.test(character) && depth === 0) {
      if (current) parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  if (current) parts.push(current);

  return parts;
};

const normalizedDeclarationMap = (declarations: StyleRule['declarations']): Map<string, string> => {
  const normalized = new Map<string, string>();

  for (const declaration of declarations) {
    if (declaration.property === 'margin' || declaration.property === 'padding') {
      const values = splitCssValue(declaration.value);
      const [top, right = top, bottom = top, left = right] =
        values.length === 3
          ? [values[0], values[1], values[2], values[1]]
          : values.length >= 4
            ? values
            : [values[0], values[1] ?? values[0], values[0], values[1] ?? values[0]];

      normalized.set(`${declaration.property}-top`, top);
      normalized.set(`${declaration.property}-right`, right);
      normalized.set(`${declaration.property}-bottom`, bottom);
      normalized.set(`${declaration.property}-left`, left);
    } else {
      normalized.set(declaration.property, declaration.value);
    }
  }

  return normalized;
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
    const keys = allStyleRules().map(
      (rule) => `${rule.context}|${rule.selectors.slice().sort().join(',')}`,
    );
    const repeatedKeys = [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];

    expect(repeatedKeys).toEqual([]);
  });

  it('keeps hover presentation inside a hover-capable media context', () => {
    const ungatedHoverSelectors = allStyleRules().flatMap((rule) =>
      rule.context.includes('@media (hover: hover)')
        ? []
        : rule.selectors
            .filter((selector) => selector.includes(':hover'))
            .map((selector) => `${rule.moduleName}:${selector}`),
    );

    expect(ungatedHoverSelectors).toEqual([]);
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

  it('does not keep longhands overwritten by a later shorthand', () => {
    const shorthandLonghands: Record<string, string[]> = {
      border: [
        'border-color',
        'border-style',
        'border-width',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
      ],
      margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
      padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    };
    const overwrittenLonghands = allStyleRules().flatMap((rule) =>
      rule.declarations.flatMap((declaration, index) => {
        const laterShorthand = rule.declarations
          .slice(index + 1)
          .find((candidate) =>
            shorthandLonghands[candidate.property]?.includes(declaration.property),
          );

        return laterShorthand
          ? [
              `${rule.moduleName}:${rule.selectors.join(',')}:${declaration.property}->${laterShorthand.property}`,
            ]
          : [];
      }),
    );

    expect(overwrittenLonghands).toEqual([]);
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

  it('does not keep media rules that repeat the effective base declarations', () => {
    const rules = allStyleRules();
    const noOpMediaRules = rules.flatMap((rule) => {
      if (!rule.context.includes('@media') || rule.declarations.length === 0) return [];

      const selectorKey = rule.selectors.slice().sort().join(',');
      const baseRule = rules.find(
        (candidate) =>
          candidate.moduleName === rule.moduleName &&
          candidate.context === '' &&
          candidate.selectors.slice().sort().join(',') === selectorKey,
      );
      if (!baseRule) return [];

      const mediaDeclarations = normalizedDeclarationMap(rule.declarations);
      const baseDeclarations = normalizedDeclarationMap(baseRule.declarations);
      const repeatsBase = [...mediaDeclarations].every(
        ([property, value]) => baseDeclarations.get(property) === value,
      );

      return repeatsBase ? [`${rule.moduleName}:${rule.context}:${selectorKey}`] : [];
    });

    expect(noOpMediaRules).toEqual([]);
  });

  it('uses logical inline geometry for symmetric physical side declarations', () => {
    const symmetricPhysicalSides = allStyleRules().flatMap((rule) =>
      ['margin', 'padding'].flatMap((property) => {
        const left = rule.declarations.find(
          (declaration) => declaration.property === `${property}-left`,
        );
        const right = rule.declarations.find(
          (declaration) => declaration.property === `${property}-right`,
        );

        return left && right && left.value === right.value
          ? [`${rule.moduleName}:${rule.selectors.join(',')}:${property}:${left.value}`]
          : [];
      }),
    );

    expect(symmetricPhysicalSides).toEqual([]);
  });

  it('coalesces meaningful identical rule bodies within each Sass module', () => {
    const bodies = new Map<string, string>();
    const repeatedBodies: string[] = [];

    for (const rule of allStyleRules()) {
      if (rule.declarations.length < 2) continue;

      const body = rule.declarations
        .map((declaration) => `${declaration.property}:${declaration.value}`)
        .sort()
        .join(';');
      const key = `${rule.moduleName}|${rule.context}|${body}`;
      const selector = rule.selectors.join(',');
      const previousSelector = bodies.get(key);

      if (previousSelector) {
        repeatedBodies.push(`${rule.moduleName}:${previousSelector}<->${selector}`);
      } else {
        bodies.set(key, selector);
      }
    }

    expect(repeatedBodies).toEqual([]);
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

  it('does not declare unused custom properties', () => {
    const source = styleModules
      .map((moduleName) =>
        fileSystem.readFileSync(`${projectRoot}/src/styles/_${moduleName}.scss`, 'utf8'),
      )
      .join('\n');
    const declared = [...source.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]);
    const consumed = new Set([...source.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]));

    expect(declared.filter((property) => !consumed.has(property))).toEqual([]);
  });

  it('does not duplicate a class selector with a type-qualified equivalent', () => {
    const redundantSelectors = allStyleRules().flatMap((rule) =>
      rule.selectors.flatMap((selector) => {
        const typeQualified = selector.match(/^[a-z][\w-]*(\.[\w-]+)$/i)?.[1];

        return typeQualified && rule.selectors.includes(typeQualified)
          ? [`${rule.moduleName}:${selector}`]
          : [];
      }),
    );

    expect(redundantSelectors).toEqual([]);
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

    expect(totalBytes).toBeLessThanOrEqual(47_900);
  });

  it('enforces a dedicated production budget for the global styles bundle', () => {
    const workspace = JSON.parse(
      fileSystem.readFileSync(`${projectRoot}/angular.json`, 'utf8'),
    ) as {
      projects: {
        borrowed: {
          architect: {
            build: {
              configurations: {
                production: {
                  budgets: {
                    type: string;
                    name?: string;
                    maximumWarning: string;
                    maximumError: string;
                  }[];
                };
              };
            };
          };
        };
      };
    };
    const stylesBudget =
      workspace.projects.borrowed.architect.build.configurations.production.budgets.find(
        (budget) => budget.type === 'bundle' && budget.name === 'styles',
      );

    expect(stylesBudget).toEqual({
      type: 'bundle',
      name: 'styles',
      maximumWarning: '38.5kB',
      maximumError: '39kB',
    });
  });
});
