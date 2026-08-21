import { enLocale } from './en';
import {
  flattenMessages,
  isPluralMessage,
  messageParameters,
  type LocaleDefinition,
} from './locale';
import { ltLocale } from './lt';
import { ruLocale } from './ru';

export const localeCatalog = {
  en: enLocale,
  ru: ruLocale,
  lt: ltLocale,
} as const satisfies Readonly<Record<string, LocaleDefinition>>;

export type SupportedLanguage = keyof typeof localeCatalog;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return Object.prototype.hasOwnProperty.call(localeCatalog, value);
}

export interface LanguageOption {
  readonly code: SupportedLanguage;
  readonly flag: string;
  readonly name: string;
  readonly locale: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = Object.values(localeCatalog).map(
  ({ code, flag, name, locale }) => ({ code, flag, name, locale }),
);

export function resolveSupportedLanguage(value: string | null | undefined): SupportedLanguage {
  const normalized = value?.trim().toLowerCase().split(/[-_]/)[0];
  return normalized && isSupportedLanguage(normalized) ? normalized : DEFAULT_LANGUAGE;
}

export function validateLocaleCatalogs(): readonly string[] {
  const issues: string[] = [];
  const reference = flattenMessages(enLocale.messages);

  for (const [registeredCode, locale] of Object.entries(localeCatalog)) {
    if (registeredCode !== locale.code) {
      issues.push(`${registeredCode}: locale file declares code ${locale.code}`);
    }
    const messages = flattenMessages(locale.messages);
    for (const [key, referenceMessage] of reference) {
      const translated = messages.get(key);
      if (translated === undefined) {
        issues.push(`${locale.code}: missing ${key}`);
        continue;
      }
      if (isPluralMessage(referenceMessage) !== isPluralMessage(translated)) {
        issues.push(`${locale.code}: plural shape differs for ${key}`);
      }
      const expectedParams = messageParameters(referenceMessage).join(',');
      const actualParams = messageParameters(translated).join(',');
      if (expectedParams !== actualParams) {
        issues.push(
          `${locale.code}: parameters for ${key} are ${actualParams || 'none'}, expected ${expectedParams || 'none'}`,
        );
      }
    }
    for (const key of messages.keys()) {
      if (!reference.has(key)) {
        issues.push(`${locale.code}: unexpected ${key}`);
      }
    }
  }

  return issues.sort();
}
