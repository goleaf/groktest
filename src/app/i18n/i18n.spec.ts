import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_OPTIONS,
  localeCatalog,
  resolveSupportedLanguage,
  validateLocaleCatalogs,
} from './catalog';
import { I18n } from './i18n';
import { renderMessage } from './locale';

describe('I18n', () => {
  it('switches the complete interface between English, Russian, and Lithuanian', () => {
    const i18n = TestBed.inject(I18n);

    expect(LANGUAGE_OPTIONS.map(({ code, flag }) => `${flag} ${code}`)).toEqual([
      '🇬🇧 en',
      '🇷🇺 ru',
      '🇱🇹 lt',
    ]);
    expect(i18n.t('home.heading')).toBe('Overview');

    i18n.setLanguage('ru');
    expect(i18n.t('home.heading')).toBe('Обзор');
    expect(i18n.t('add.saveRecord')).toBe('Сохранить запись');
    expect(i18n.locale()).toBe('ru-RU');
    expect(document.documentElement.lang).toBe('ru');

    i18n.setLanguage('lt');
    expect(i18n.t('home.heading')).toBe('Apžvalga');
    expect(i18n.t('add.saveRecord')).toBe('Išsaugoti įrašą');
    expect(i18n.locale()).toBe('lt-LT');
    expect(document.documentElement.lang).toBe('lt');
  });

  it('interpolates translated parameters after a language change', () => {
    const i18n = TestBed.inject(I18n);
    i18n.setLanguage('ru');
    expect(i18n.t('home.openCount', { count: 3 })).toBe('3 открытые записи');

    i18n.setLanguage('lt');
    expect(i18n.t('detail.remaining', { amount: '40 €' })).toBe('Liko 40 €');
  });

  it('uses locale-aware plural rules instead of concatenating count fragments', () => {
    const i18n = TestBed.inject(I18n);

    i18n.setLanguage('en');
    expect(i18n.t('home.openCount', { count: 1 })).toBe('1 open record');
    expect(i18n.t('home.openCount', { count: 2 })).toBe('2 open records');

    i18n.setLanguage('ru');
    expect(i18n.t('home.openCount', { count: 1 })).toBe('1 открытая запись');
    expect(i18n.t('home.openCount', { count: 2 })).toBe('2 открытые записи');
    expect(i18n.t('home.openCount', { count: 5 })).toBe('5 открытых записей');

    i18n.setLanguage('lt');
    expect(i18n.t('home.openCount', { count: 1 })).toBe('1 aktyvus įrašas');
    expect(i18n.t('home.openCount', { count: 2 })).toBe('2 aktyvūs įrašai');
    expect(i18n.t('home.openCount', { count: 10 })).toBe('10 aktyvių įrašų');
  });

  it('covers the reminder plural categories in Russian and Lithuanian', () => {
    const i18n = TestBed.inject(I18n);

    i18n.setLanguage('ru');
    expect(i18n.t('reminder.overdueBy', { count: 1 })).toBe('Просрочено на 1 день');
    expect(i18n.t('reminder.overdueBy', { count: 2 })).toBe('Просрочено на 2 дня');
    expect(i18n.t('reminder.overdueBy', { count: 5 })).toBe('Просрочено на 5 дней');
    expect(i18n.t('reminder.overdueBy', { count: 21 })).toBe('Просрочено на 21 день');

    i18n.setLanguage('lt');
    expect(i18n.t('reminder.overdueBy', { count: 1 })).toBe('Vėluoja 1 dieną');
    expect(i18n.t('reminder.overdueBy', { count: 2 })).toBe('Vėluoja 2 dienas');
    expect(i18n.t('reminder.overdueBy', { count: 10 })).toBe('Vėluoja 10 dienų');
    expect(i18n.t('reminder.overdueBy', { count: 21 })).toBe('Vėluoja 21 dieną');
  });

  it('uses complete person and item plurals in Russian and Lithuanian', () => {
    const i18n = TestBed.inject(I18n);

    i18n.setLanguage('ru');
    expect(i18n.t('person.items', { count: 1 })).toBe('1 вещь');
    expect(i18n.t('person.items', { count: 2 })).toBe('2 вещи');
    expect(i18n.t('person.items', { count: 5 })).toBe('5 вещей');

    i18n.setLanguage('lt');
    expect(i18n.t('person.items', { count: 1 })).toBe('1 daiktas');
    expect(i18n.t('person.items', { count: 2 })).toBe('2 daiktai');
    expect(i18n.t('person.items', { count: 10 })).toBe('10 daiktų');
  });

  it('keeps metadata inside each locale file and resolves browser locale variants', () => {
    expect(localeCatalog.en.messages.home.heading).toBe('Overview');
    expect(localeCatalog.ru.flag).toBe('🇷🇺');
    expect(localeCatalog.lt.name).toBe('Lietuvių');
    expect(resolveSupportedLanguage('lt-LT')).toBe('lt');
    expect(resolveSupportedLanguage('ru_RU')).toBe('ru');
    expect(resolveSupportedLanguage('de-DE')).toBe('en');
  });

  it('has identical message keys and interpolation parameters in every locale file', () => {
    expect(validateLocaleCatalogs()).toEqual([]);
  });

  it('falls back predictably when an unknown translation key is requested', () => {
    const i18n = TestBed.inject(I18n);
    i18n.setLanguage('lt');
    expect(i18n.t('future.missing')).toBe('future.missing');
  });

  it('renders an intentional empty message without substituting a key', () => {
    expect(renderMessage('', 'ru-RU', {})).toBe('');
  });
});
