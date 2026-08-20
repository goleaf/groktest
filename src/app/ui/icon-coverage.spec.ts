import { describe, expect, it } from 'vitest';

const processApi = globalThis as typeof globalThis & {
  process: {
    cwd(): string;
    getBuiltinModule(name: 'fs'): {
      readFileSync(path: string, encoding: 'utf8'): string;
    };
  };
};

const featureSource = (path: string): string =>
  processApi.process
    .getBuiltinModule('fs')
    .readFileSync(`${processApi.process.cwd()}/src/app/features/${path}`, 'utf8');

describe('semantic icon coverage', () => {
  it('uses the shared icon heading on every top-level utility screen', () => {
    const coverage = {
      'home/home-page.ts': 'home',
      'add/add-page.ts': 'add',
      'search/search-page.ts': 'search',
      'history/history-page.ts': 'history',
      'people/people-page.ts': 'people',
      'more/more-page.ts': 'more',
      'settings/settings-page.ts': 'settings',
    } as const;

    for (const [file, icon] of Object.entries(coverage)) {
      expect(featureSource(file)).toMatch(new RegExp(`<app-page-heading\\s+icon="${icon}"`));
    }
  });

  it('covers selectors, filters, empty states and settings actions with icons', () => {
    const add = featureSource('add/add-page.ts');
    const list = featureSource('lists/list-page.ts');
    const settings = featureSource('settings/settings-page.ts');

    for (const icon of ['lent', 'borrowed', 'item', 'money']) {
      expect(add).toMatch(new RegExp(`<app-icon[^>]*name="${icon}"`));
    }
    expect(list).toContain('iconForScope(option)');
    expect(list).toContain('iconForFilter(option)');
    expect(list).toContain('[icon]="icon()"');
    expect(settings).toContain('<app-icon name="language"');
    expect(settings).toContain('<app-icon name="download"');
    expect(settings).toContain('<app-icon name="info"');
  });

  it('adds status and recovery icons to detail and person surfaces', () => {
    const detail = featureSource('detail/detail-page.ts');
    const person = featureSource('people/person-page.ts');

    expect(detail).toContain('<p class="error icon-line"');
    expect(detail).toContain('<app-icon name="records" />');
    expect(person).toMatch(/section-heading[\s\S]*?<app-icon name="records"/);
    expect(person).toMatch(/section-heading[\s\S]*?<app-icon name="history"/);
    expect(person).toContain('<app-icon name="people" />');
  });
});
