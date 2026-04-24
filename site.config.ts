export const supportedLocales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar', 'tr'] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeConfig: Record<Locale, { label: string; locale: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English', locale: 'en_US', dir: 'ltr' },
  zh: { label: '中文', locale: 'zh_CN', dir: 'ltr' },
  ja: { label: '日本語', locale: 'ja_JP', dir: 'ltr' },
  ko: { label: '한국어', locale: 'ko_KR', dir: 'ltr' },
  es: { label: 'Español', locale: 'es_ES', dir: 'ltr' },
  fr: { label: 'Français', locale: 'fr_FR', dir: 'ltr' },
  de: { label: 'Deutsch', locale: 'de_DE', dir: 'ltr' },
  pt: { label: 'Português', locale: 'pt_BR', dir: 'ltr' },
  ru: { label: 'Русский', locale: 'ru_RU', dir: 'ltr' },
  ar: { label: 'العربية', locale: 'ar_SA', dir: 'rtl' },
  tr: { label: 'Türkçe', locale: 'tr_TR', dir: 'ltr' },
};

export const siteConfig = {
  name: 'SteamPulse',
  url: 'https://steampulse.pages.dev',
  description: 'Your daily source for Steam gaming news, reviews, and guides. Covering the latest PC game releases, updates, and community highlights.',
  language: 'en',
  locale: 'en_US',
  defaultLocale: 'en' as Locale,

  steam: {
    appIds: [730, 570, 440, 1172470, 892970, 1245620, 1091500, 553850, 1174180],
    categories: ['fps', 'rpg', 'strategy', 'survival', 'indie', 'action', 'simulation'],
    articlesPerBuild: 10,
  },

  theme: {
    accentColor: '#66c0f4',
    accentHot: '#ff6b35',
  },

  organization: {
    name: 'SteamPulse',
    logo: '/logo.svg',
    sameAs: [] as string[],
  },

  nav: [
    { label: 'News', href: '/news' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Guides', href: '/guides' },
    { label: 'About', href: '/about' },
  ],

  categories: [
    { slug: 'news', label: 'News', color: '#66c0f4' },
    { slug: 'update', label: 'Updates', color: '#1b9de2' },
    { slug: 'release', label: 'Releases', color: '#4ade80' },
    { slug: 'event', label: 'Events', color: '#c084fc' },
    { slug: 'esports', label: 'Esports', color: '#fbbf24' },
    { slug: 'review', label: 'Reviews', color: '#ff6b35' },
    { slug: 'guide', label: 'Guides', color: '#34d399' },
    { slug: 'tutorial', label: 'Tutorials', color: '#38bdf8' },
    { slug: 'tips', label: 'Tips', color: '#a78bfa' },
  ],
  // Analytics (leave empty to disable)
  analytics: {
    plausible: '', // e.g. 'steamnewsdaily.com'
    googleAnalytics: '', // e.g. 'G-XXXXXXXXXX'
  },

} as const;

export type SiteConfig = typeof siteConfig;
