// Fetches real security news headlines from Google News RSS feeds
// These are free, public RSS feeds — no API key needed

const FEED_URLS: Record<string, string> = {
  all: "https://news.google.com/rss/search?q=security+alarm+CCTV+surveillance&hl=en&gl=US&ceid=US:en",
  residential: "https://news.google.com/rss/search?q=home+security+alarm+system+smart+home&hl=en&gl=US&ceid=US:en",
  commercial: "https://news.google.com/rss/search?q=commercial+security+access+control+business+surveillance&hl=en&gl=US&ceid=US:en",
  cybersecurity: "https://news.google.com/rss/search?q=cybersecurity+threats+data+breach+security&hl=en&gl=US&ceid=US:en",
  industry: "https://news.google.com/rss/search?q=security+industry+trends+technology+market&hl=en&gl=US&ceid=US:en",
};

export interface NewsHeadline {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export async function fetchSecurityNews(focus: string = "all"): Promise<NewsHeadline[]> {
  const feedUrl = FEED_URLS[focus] || FEED_URLS.all;

  try {
    const response = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!response.ok) {
      console.error("Failed to fetch news feed:", response.status);
      return [];
    }

    const xml = await response.text();
    return parseRSS(xml);
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

function parseRSS(xml: string): NewsHeadline[] {
  const headlines: NewsHeadline[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const sourceRegex = /<source[^>]*>(.*?)<\/source>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null && headlines.length < 15) {
    const item = match[1];
    const title = item.match(titleRegex);
    const link = item.match(linkRegex);
    const pubDate = item.match(pubDateRegex);
    const source = item.match(sourceRegex);

    if (title) {
      headlines.push({
        title: (title[1] || title[2] || "").trim(),
        link: link ? link[1].trim() : "",
        pubDate: pubDate ? pubDate[1].trim() : "",
        source: source ? source[1].trim() : "Unknown",
      });
    }
  }

  return headlines;
}
