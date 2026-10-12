import * as cheerio from 'cheerio';

export function parseHtml(html, baseUrl) {
  if (!html || typeof html !== 'string') {
    return { title: 'Untitled Document', snippet: '', links: [] };
  }

  const $ = cheerio.load(html);

  // Remove boilerplate & non-content tags
  $('script, style, noscript, svg, iframe, nav, footer, header, form').remove();

  // Extract page title
  let title = $('title').text().trim();
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || 'Untitled Document';
  }
  title = title.replace(/\s+/g, ' ').slice(0, 200);

  // Extract body text snippet up to 12,000 characters (full article/document depth)
  let bodyText = $('article').text();
  if (!bodyText || bodyText.trim().length < 80) {
    bodyText = $('main').text();
  }
  if (!bodyText || bodyText.trim().length < 80) {
    bodyText = $('body').text();
  }

  const cleanedSnippet = bodyText
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000);

  // Extract hyperlinks
  const links = [];
  const seen = new Set();

  $('a[href]').each((_, el) => {
    try {
      const rawHref = $(el).attr('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) {
        return;
      }
      const absoluteUrl = new URL(rawHref, baseUrl).href;
      if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
        if (!seen.has(absoluteUrl)) {
          seen.add(absoluteUrl);
          links.push(absoluteUrl);
        }
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  return {
    title,
    snippet: cleanedSnippet,
    links: links.slice(0, 30) // Up to top 30 links
  };
}
