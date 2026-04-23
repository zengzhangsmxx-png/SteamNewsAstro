import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../site.config';

export async function GET(context: any) {
  const news = await getCollection('news', ({ data }) => !data.draft);
  const reviews = await getCollection('reviews', ({ data }) => !data.draft);
  const guides = await getCollection('guides', ({ data }) => !data.draft);

  const items = [...news, ...reviews, ...guides]
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
    .map(post => {
      const collection = 'rating' in post.data ? 'reviews' : 'category' in post.data && ['guide', 'tutorial', 'tips'].includes(post.data.category) ? 'guides' : 'news';
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishDate,
        link: `/${collection}/${post.slug}/`,
        categories: post.data.tags,
      };
    });

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site,
    items,
    customData: `<language>${siteConfig.language}</language>`,
  });
}
