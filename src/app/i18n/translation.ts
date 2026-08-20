import type { Message, PluralMessage } from './locale';

export type TranslationOf<T> = {
  readonly [Key in keyof T]: T[Key] extends string | PluralMessage
    ? Message
    : TranslationOf<T[Key]>;
};
