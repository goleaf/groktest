import { computed, Injectable, signal } from '@angular/core';
import {
  DEFAULT_LANGUAGE,
  localeCatalog,
  resolveSupportedLanguage,
  type SupportedLanguage,
} from './catalog';
import { findMessage, renderMessage, type TranslationParams } from './locale';

export { LANGUAGE_OPTIONS } from './catalog';

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly language = signal<SupportedLanguage>(DEFAULT_LANGUAGE);
  readonly locale = computed(() => localeCatalog[this.language()].locale);

  setLanguage(language: SupportedLanguage | string): void {
    const resolved = resolveSupportedLanguage(language);
    this.language.set(resolved);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = localeCatalog[resolved].htmlLang;
    }
  }

  t(key: string, params: TranslationParams = {}): string {
    const activeLocale = localeCatalog[this.language()];
    const message =
      findMessage(activeLocale.messages, key) ??
      findMessage(localeCatalog[DEFAULT_LANGUAGE].messages, key);
    if (message === undefined) {
      return key;
    }
    return renderMessage(message, activeLocale.locale, params);
  }
}
