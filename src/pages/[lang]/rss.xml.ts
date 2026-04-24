import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig, supportedLocales, localeConfig } from '../../../site.config';

const nonEnLocales = supportedLocales.filter(l => l !== 'en');

export function getStaticPaths() {
  return nonEnLocales.map(lang => ({ params: { lang } }));
}

export async function GET(context: any) {
  const lang = context.params.lang as string;
  const config = localeConfig[lang as keyof typeof localeConfig];
  if (!config) return new Response('Not found', { status: 404 });

  const collections = await Promise.all([
    getCollection(`news-${lang}` as any, ({ data }: any) => !data.draft).catch(() => []),
    getCollection(`reviews-${lang}` as any, ({ data }: any) => !data.draft).catch(() => []),
    getCollection(`guides-${lang}` as any, ({ data }: any) => !data.draft).catch(() => []),
  ]);

  const [news, reviews, guides] = collections;

  const items = [...news, ...reviews, ...guides]
    .sort((a: any, b: any) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
    .map((post: any) => {
      const collection = 'rating' in post.data ? 'reviews' : 'category' in post.data && ['guide', 'tutorial', 'tips'].includes(post.data.category) ? 'guides' : 'news';
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishDate,
        link: `/${lang}/${collection}/${post.slug}/`,
        categories: post.data.tags,
      };
    });

  return rss({
    title: `${siteConfig.name} (${config.label})`,
    description: siteConfig.description,
    site: context.site,
    items,
    customData: `<language>${config.locale.replace('_', '-')}</language>`,
  });
}
