import { supportedLocales, localeConfig, type Locale } from '../../site.config';
import { translations } from './translations';

export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && supportedLocales.includes(seg as Locale) && seg !== 'en') {
    return seg as Locale;
  }
  return 'en';
}

export function t(lang: Locale) {
  return translations[lang] ?? translations.en;
}

export function localePath(path: string, lang: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'en') return clean;
  return `/${lang}${clean}`;
}

export function getAlternateUrls(basePath: string, siteUrl: string): { lang: Locale; href: string }[] {
  const clean = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return supportedLocales.map(lang => ({
    lang,
    href: `${siteUrl}${localePath(clean, lang)}`,
  }));
}

export function getDir(lang: Locale): 'ltr' | 'rtl' {
  return localeConfig[lang]?.dir ?? 'ltr';
}

export function getLocaleCode(lang: Locale): string {
  return localeConfig[lang]?.locale ?? 'en_US';
}

export function getCollectionName(base: string, lang: Locale): string {
  if (lang === 'en') return base;
  return `${base}-${lang}`;
}

export { supportedLocales, localeConfig, type Locale };
