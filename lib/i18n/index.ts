import { ar } from './ar';
import { en } from './en';

export type Locale = 'ar' | 'en';

type DeepString<T> = {
  [K in keyof T]: T[K] extends readonly string[]
    ? readonly string[]
    : T[K] extends string
    ? string
    : T[K] extends object
    ? DeepString<T[K]>
    : T[K];
};

export type Translations = DeepString<typeof ar>;

export const translations: Record<Locale, Translations> = { ar, en };

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations.ar;
}

export { ar, en };
