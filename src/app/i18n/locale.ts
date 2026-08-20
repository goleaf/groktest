export type TranslationParams = Readonly<Record<string, string | number>>;

export type PluralForms = Readonly<
  Partial<Record<Intl.LDMLPluralRule, string>> & { readonly other: string }
>;

export interface PluralMessage {
  readonly $plural: PluralForms;
}

export type Message = string | PluralMessage;
export interface MessageTree {
  readonly [key: string]: Message | MessageTree;
}

export interface LocaleDefinition<Code extends string = string> {
  readonly code: Code;
  readonly locale: string;
  readonly htmlLang: string;
  readonly flag: string;
  readonly name: string;
  readonly messages: MessageTree;
}

export function plural(forms: PluralForms): PluralMessage {
  return { $plural: forms };
}

export function defineLocale<const Definition extends LocaleDefinition>(
  definition: Definition,
): Definition {
  return definition;
}

export function isPluralMessage(value: unknown): value is PluralMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$plural' in value &&
    typeof (value as PluralMessage).$plural.other === 'string'
  );
}

export function findMessage(tree: MessageTree, path: string): Message | undefined {
  const parts = path.split('.');
  let current: Message | MessageTree | undefined = tree;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || isPluralMessage(current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' || isPluralMessage(current) ? current : undefined;
}

export function renderMessage(message: Message, locale: string, params: TranslationParams): string {
  let template: string;
  if (isPluralMessage(message)) {
    const count = params['count'];
    const numericCount = typeof count === 'number' ? count : Number(count);
    const category = Number.isFinite(numericCount)
      ? new Intl.PluralRules(locale).select(numericCount)
      : 'other';
    template = message.$plural[category] ?? message.$plural.other;
  } else {
    template = message;
  }

  for (const [name, value] of Object.entries(params)) {
    template = template.replaceAll(`{${name}}`, String(value));
  }
  return template;
}

export function flattenMessages(tree: MessageTree, prefix = ''): ReadonlyMap<string, Message> {
  const flattened = new Map<string, Message>();
  for (const [name, value] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string' || isPluralMessage(value)) {
      flattened.set(key, value);
      continue;
    }
    for (const [nestedKey, nestedValue] of flattenMessages(value, key)) {
      flattened.set(nestedKey, nestedValue);
    }
  }
  return flattened;
}

export function messageParameters(message: Message): readonly string[] {
  const templates = isPluralMessage(message)
    ? Object.values(message.$plural).filter((value): value is string => typeof value === 'string')
    : [message];
  const names = new Set<string>();
  for (const template of templates) {
    for (const match of template.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)) {
      if (match[1]) {
        names.add(match[1]);
      }
    }
  }
  return [...names].sort();
}
