import type { Locale } from '../../site.config';

type TranslationKeys = {
  nav: { news: string; reviews: string; guides: string; about: string };
  home: { latestNews: string; viewAll: string; stayUpdated: string; subscribeRss: string; rssDesc: string };
  article: { minRead: string; featured: string; draft: string; tldr: string; faq: string; tableOfContents: string; relatedArticles: string; publishedOn: string; updatedOn: string };
  review: { pros: string; cons: string; rating: string; verdict: string };
  guide: { difficulty: string; beginner: string; intermediate: string; advanced: string };
  category: Record<string, string>;
  meta: { siteDescription: string };
};

export const translations: Record<Locale, TranslationKeys> = {
  en: {
    nav: { news: 'News', reviews: 'Reviews', guides: 'Guides', about: 'About' },
    home: { latestNews: 'Latest News', viewAll: 'View all', stayUpdated: 'Stay Updated', subscribeRss: 'Subscribe via RSS', rssDesc: 'Get the latest Steam news delivered to your inbox.' },
    article: { minRead: 'min read', featured: 'Featured', draft: 'Draft', tldr: 'TL;DR', faq: 'FAQ', tableOfContents: 'Table of Contents', relatedArticles: 'Related Articles', publishedOn: 'Published on', updatedOn: 'Updated on' },
    review: { pros: 'Pros', cons: 'Cons', rating: 'Rating', verdict: 'Verdict' },
    guide: { difficulty: 'Difficulty', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    category: { news: 'News', update: 'Updates', release: 'Releases', event: 'Events', esports: 'Esports', review: 'Reviews', guide: 'Guides', tutorial: 'Tutorials', tips: 'Tips' },
    meta: { siteDescription: 'Your daily source for Steam gaming news, reviews, and guides.' },
  },
  zh: {
    nav: { news: '新闻', reviews: '评测', guides: '攻略', about: '关于' },
    home: { latestNews: '最新新闻', viewAll: '查看全部', stayUpdated: '保持更新', subscribeRss: '订阅 RSS', rssDesc: '获取最新 Steam 游戏资讯。' },
    article: { minRead: '分钟阅读', featured: '精选', draft: '草稿', tldr: '摘要', faq: '常见问题', tableOfContents: '目录', relatedArticles: '相关文章', publishedOn: '发布于', updatedOn: '更新于' },
    review: { pros: '优点', cons: '缺点', rating: '评分', verdict: '总评' },
    guide: { difficulty: '难度', beginner: '入门', intermediate: '进阶', advanced: '高级' },
    category: { news: '新闻', update: '更新', release: '发布', event: '活动', esports: '电竞', review: '评测', guide: '攻略', tutorial: '教程', tips: '技巧' },
    meta: { siteDescription: '每日 Steam 游戏新闻、评测与攻略。' },
  },
  ja: {
    nav: { news: 'ニュース', reviews: 'レビュー', guides: 'ガイド', about: '概要' },
    home: { latestNews: '最新ニュース', viewAll: 'すべて見る', stayUpdated: '最新情報', subscribeRss: 'RSS購読', rssDesc: '最新のSteamゲームニュースをお届けします。' },
    article: { minRead: '分で読める', featured: '注目', draft: '下書き', tldr: '要約', faq: 'よくある質問', tableOfContents: '目次', relatedArticles: '関連記事', publishedOn: '公開日', updatedOn: '更新日' },
    review: { pros: '長所', cons: '短所', rating: '評価', verdict: '総評' },
    guide: { difficulty: '難易度', beginner: '初心者', intermediate: '中級者', advanced: '上級者' },
    category: { news: 'ニュース', update: 'アップデート', release: 'リリース', event: 'イベント', esports: 'eスポーツ', review: 'レビュー', guide: 'ガイド', tutorial: 'チュートリアル', tips: 'ヒント' },
    meta: { siteDescription: 'Steamゲームの最新ニュース、レビュー、ガイド。' },
  },
  ko: {
    nav: { news: '뉴스', reviews: '리뷰', guides: '가이드', about: '소개' },
    home: { latestNews: '최신 뉴스', viewAll: '전체 보기', stayUpdated: '최신 소식', subscribeRss: 'RSS 구독', rssDesc: '최신 Steam 게임 뉴스를 받아보세요.' },
    article: { minRead: '분 소요', featured: '추천', draft: '초안', tldr: '요약', faq: '자주 묻는 질문', tableOfContents: '목차', relatedArticles: '관련 기사', publishedOn: '게시일', updatedOn: '수정일' },
    review: { pros: '장점', cons: '단점', rating: '평점', verdict: '총평' },
    guide: { difficulty: '난이도', beginner: '초급', intermediate: '중급', advanced: '고급' },
    category: { news: '뉴스', update: '업데이트', release: '출시', event: '이벤트', esports: 'e스포츠', review: '리뷰', guide: '가이드', tutorial: '튜토리얼', tips: '팁' },
    meta: { siteDescription: 'Steam 게임 최신 뉴스, 리뷰, 가이드.' },
  },
  es: {
    nav: { news: 'Noticias', reviews: 'Análisis', guides: 'Guías', about: 'Acerca de' },
    home: { latestNews: 'Últimas Noticias', viewAll: 'Ver todo', stayUpdated: 'Mantente al día', subscribeRss: 'Suscribirse vía RSS', rssDesc: 'Recibe las últimas noticias de Steam.' },
    article: { minRead: 'min de lectura', featured: 'Destacado', draft: 'Borrador', tldr: 'Resumen', faq: 'Preguntas frecuentes', tableOfContents: 'Índice', relatedArticles: 'Artículos relacionados', publishedOn: 'Publicado el', updatedOn: 'Actualizado el' },
    review: { pros: 'Pros', cons: 'Contras', rating: 'Puntuación', verdict: 'Veredicto' },
    guide: { difficulty: 'Dificultad', beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
    category: { news: 'Noticias', update: 'Actualizaciones', release: 'Lanzamientos', event: 'Eventos', esports: 'Esports', review: 'Análisis', guide: 'Guías', tutorial: 'Tutoriales', tips: 'Consejos' },
    meta: { siteDescription: 'Tu fuente diaria de noticias, análisis y guías de juegos en Steam.' },
  },
  fr: {
    nav: { news: 'Actualités', reviews: 'Tests', guides: 'Guides', about: 'À propos' },
    home: { latestNews: 'Dernières Actualités', viewAll: 'Voir tout', stayUpdated: 'Restez informé', subscribeRss: "S'abonner via RSS", rssDesc: 'Recevez les dernières nouvelles Steam.' },
    article: { minRead: 'min de lecture', featured: 'À la une', draft: 'Brouillon', tldr: 'Résumé', faq: 'FAQ', tableOfContents: 'Sommaire', relatedArticles: 'Articles similaires', publishedOn: 'Publié le', updatedOn: 'Mis à jour le' },
    review: { pros: 'Points forts', cons: 'Points faibles', rating: 'Note', verdict: 'Verdict' },
    guide: { difficulty: 'Difficulté', beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' },
    category: { news: 'Actualités', update: 'Mises à jour', release: 'Sorties', event: 'Événements', esports: 'Esports', review: 'Tests', guide: 'Guides', tutorial: 'Tutoriels', tips: 'Astuces' },
    meta: { siteDescription: 'Votre source quotidienne de news, tests et guides de jeux Steam.' },
  },
  de: {
    nav: { news: 'Nachrichten', reviews: 'Tests', guides: 'Guides', about: 'Über uns' },
    home: { latestNews: 'Neueste Nachrichten', viewAll: 'Alle anzeigen', stayUpdated: 'Auf dem Laufenden', subscribeRss: 'RSS abonnieren', rssDesc: 'Erhalte die neuesten Steam-Gaming-News.' },
    article: { minRead: 'Min. Lesezeit', featured: 'Empfohlen', draft: 'Entwurf', tldr: 'Zusammenfassung', faq: 'FAQ', tableOfContents: 'Inhaltsverzeichnis', relatedArticles: 'Ähnliche Artikel', publishedOn: 'Veröffentlicht am', updatedOn: 'Aktualisiert am' },
    review: { pros: 'Vorteile', cons: 'Nachteile', rating: 'Bewertung', verdict: 'Fazit' },
    guide: { difficulty: 'Schwierigkeit', beginner: 'Anfänger', intermediate: 'Fortgeschritten', advanced: 'Experte' },
    category: { news: 'Nachrichten', update: 'Updates', release: 'Neuerscheinungen', event: 'Events', esports: 'Esports', review: 'Tests', guide: 'Guides', tutorial: 'Tutorials', tips: 'Tipps' },
    meta: { siteDescription: 'Deine tägliche Quelle für Steam-Gaming-News, Tests und Guides.' },
  },
  pt: {
    nav: { news: 'Notícias', reviews: 'Análises', guides: 'Guias', about: 'Sobre' },
    home: { latestNews: 'Últimas Notícias', viewAll: 'Ver tudo', stayUpdated: 'Fique atualizado', subscribeRss: 'Assinar via RSS', rssDesc: 'Receba as últimas notícias de jogos Steam.' },
    article: { minRead: 'min de leitura', featured: 'Destaque', draft: 'Rascunho', tldr: 'Resumo', faq: 'Perguntas frequentes', tableOfContents: 'Índice', relatedArticles: 'Artigos relacionados', publishedOn: 'Publicado em', updatedOn: 'Atualizado em' },
    review: { pros: 'Prós', cons: 'Contras', rating: 'Nota', verdict: 'Veredito' },
    guide: { difficulty: 'Dificuldade', beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' },
    category: { news: 'Notícias', update: 'Atualizações', release: 'Lançamentos', event: 'Eventos', esports: 'Esports', review: 'Análises', guide: 'Guias', tutorial: 'Tutoriais', tips: 'Dicas' },
    meta: { siteDescription: 'Sua fonte diária de notícias, análises e guias de jogos Steam.' },
  },
  ru: {
    nav: { news: 'Новости', reviews: 'Обзоры', guides: 'Гайды', about: 'О нас' },
    home: { latestNews: 'Последние новости', viewAll: 'Смотреть все', stayUpdated: 'Будьте в курсе', subscribeRss: 'Подписаться на RSS', rssDesc: 'Получайте последние новости Steam.' },
    article: { minRead: 'мин чтения', featured: 'Избранное', draft: 'Черновик', tldr: 'Кратко', faq: 'Частые вопросы', tableOfContents: 'Содержание', relatedArticles: 'Похожие статьи', publishedOn: 'Опубликовано', updatedOn: 'Обновлено' },
    review: { pros: 'Плюсы', cons: 'Минусы', rating: 'Оценка', verdict: 'Вердикт' },
    guide: { difficulty: 'Сложность', beginner: 'Новичок', intermediate: 'Средний', advanced: 'Продвинутый' },
    category: { news: 'Новости', update: 'Обновления', release: 'Релизы', event: 'События', esports: 'Киберспорт', review: 'Обзоры', guide: 'Гайды', tutorial: 'Туториалы', tips: 'Советы' },
    meta: { siteDescription: 'Ежедневные новости, обзоры и гайды по играм в Steam.' },
  },
  ar: {
    nav: { news: 'أخبار', reviews: 'مراجعات', guides: 'أدلة', about: 'حول' },
    home: { latestNews: 'آخر الأخبار', viewAll: 'عرض الكل', stayUpdated: 'ابقَ على اطلاع', subscribeRss: 'اشترك عبر RSS', rssDesc: 'احصل على آخر أخبار ألعاب Steam.' },
    article: { minRead: 'دقائق قراءة', featured: 'مميز', draft: 'مسودة', tldr: 'ملخص', faq: 'الأسئلة الشائعة', tableOfContents: 'المحتويات', relatedArticles: 'مقالات ذات صلة', publishedOn: 'نُشر في', updatedOn: 'تم التحديث في' },
    review: { pros: 'الإيجابيات', cons: 'السلبيات', rating: 'التقييم', verdict: 'الحكم' },
    guide: { difficulty: 'الصعوبة', beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' },
    category: { news: 'أخبار', update: 'تحديثات', release: 'إصدارات', event: 'فعاليات', esports: 'رياضات إلكترونية', review: 'مراجعات', guide: 'أدلة', tutorial: 'دروس', tips: 'نصائح' },
    meta: { siteDescription: 'مصدرك اليومي لأخبار ومراجعات وأدلة ألعاب Steam.' },
  },
  tr: {
    nav: { news: 'Haberler', reviews: 'İncelemeler', guides: 'Rehberler', about: 'Hakkında' },
    home: { latestNews: 'Son Haberler', viewAll: 'Tümünü gör', stayUpdated: 'Güncel kalın', subscribeRss: 'RSS ile abone ol', rssDesc: 'En son Steam oyun haberlerini alın.' },
    article: { minRead: 'dk okuma', featured: 'Öne Çıkan', draft: 'Taslak', tldr: 'Özet', faq: 'SSS', tableOfContents: 'İçindekiler', relatedArticles: 'İlgili Makaleler', publishedOn: 'Yayınlanma', updatedOn: 'Güncellenme' },
    review: { pros: 'Artılar', cons: 'Eksiler', rating: 'Puan', verdict: 'Sonuç' },
    guide: { difficulty: 'Zorluk', beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri' },
    category: { news: 'Haberler', update: 'Güncellemeler', release: 'Çıkışlar', event: 'Etkinlikler', esports: 'Espor', review: 'İncelemeler', guide: 'Rehberler', tutorial: 'Eğitimler', tips: 'İpuçları' },
    meta: { siteDescription: 'Steam oyun haberleri, incelemeleri ve rehberleri için günlük kaynağınız.' },
  },
};
