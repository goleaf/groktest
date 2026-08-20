import { Injectable } from '@angular/core';
import { en } from './en';

interface Nested {
  readonly [key: string]: string | Nested;
}

function lookup(tree: Nested, path: string): string | undefined {
  const parts = path.split('.');
  let current: string | Nested | undefined = tree;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

@Injectable({ providedIn: 'root' })
export class I18n {
  t(key: string, params: Record<string, string | number> = {}): string {
    let template = lookup(en as unknown as Nested, key) ?? key;
    for (const [name, value] of Object.entries(params)) {
      template = template.replaceAll(`{${name}}`, String(value));
    }
    return template;
  }
}
