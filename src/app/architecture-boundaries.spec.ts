import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
      readdirSync(
        path: string,
        options: { withFileTypes: true },
      ): { isDirectory(): boolean; isFile(): boolean; name: string }[];
    };
  };
};

const fileSystem = processApi.process.getBuiltinModule('fs');
const projectRoot = processApi.process.cwd();

function productionTypeScriptFiles(relativeDirectory: string): string[] {
  const directory = `${projectRoot}/${relativeDirectory}`;

  return fileSystem
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = `${relativeDirectory}/${entry.name}`;

      if (entry.isDirectory()) {
        return productionTypeScriptFiles(relativePath);
      }

      return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
        ? [relativePath]
        : [];
    })
    .sort();
}

function moduleSpecifiers(relativePath: string): string[] {
  const source = fileSystem.readFileSync(`${projectRoot}/${relativePath}`, 'utf8');
  const fromStatements = [
    ...source.matchAll(/(?:import|export)\s+(?:type\s+)?[^;]*?\s+from\s+['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);
  const sideEffectImports = [...source.matchAll(/import\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
  const dynamicImports = [...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(
    (match) => match[1],
  );

  return [...fromStatements, ...sideEffectImports, ...dynamicImports];
}

function matchingImports(
  relativeDirectories: readonly string[],
  isForbidden: (specifier: string) => boolean,
): string[] {
  return relativeDirectories.flatMap((directory) =>
    productionTypeScriptFiles(directory).flatMap((relativePath) =>
      moduleSpecifiers(relativePath)
        .filter(isForbidden)
        .map((specifier) => `${relativePath} -> ${specifier}`),
    ),
  );
}

describe('architecture import boundaries', () => {
  it('keeps the domain free of framework, persistence, platform, and outer-layer imports', () => {
    const forbidden = matchingImports(['src/app/domain'], (specifier) =>
      [
        '@angular/',
        'dexie',
        '@capacitor/',
        'electron',
        '../data/',
        '../features/',
        '../layout/',
        '../ui/',
      ].some((prefix) => specifier === prefix.replace(/\/$/, '') || specifier.startsWith(prefix)),
    );

    expect(forbidden).toEqual([]);
  });

  it('does not broaden the one known domain-to-i18n dependency before Stage 3 removes it', () => {
    const domainI18nImports = matchingImports(['src/app/domain'], (specifier) =>
      specifier.startsWith('../i18n/'),
    );

    expect(domainI18nImports).toEqual([
      'src/app/domain/types.ts -> ../i18n/catalog',
      'src/app/domain/types.ts -> ../i18n/catalog',
    ]);
  });

  it('keeps presentation layers away from concrete persistence and native implementations', () => {
    const forbidden = matchingImports(
      ['src/app/features', 'src/app/i18n', 'src/app/layout', 'src/app/ui'],
      (specifier) =>
        specifier === 'dexie' ||
        specifier.startsWith('dexie/') ||
        specifier.startsWith('@capacitor/') ||
        specifier === 'electron' ||
        specifier.startsWith('electron/') ||
        /\/data\/(database|dexie-store|mappers|rows)(?:$|\/)/.test(specifier),
    );

    expect(forbidden).toEqual([]);
  });

  it('keeps presentation layers independent from the data-layer store contract', () => {
    const presentationStoreImports = matchingImports(
      ['src/app/features', 'src/app/i18n', 'src/app/layout', 'src/app/ui'],
      (specifier) => /\/data\/store(?:$|\/)/.test(specifier),
    );

    expect(presentationStoreImports).toEqual([]);
  });
});
