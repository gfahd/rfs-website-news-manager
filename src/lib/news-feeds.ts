// Fetches real security news headlines from Google News RSS feeds
// These are free, public RSS feeds — no API key needed

export interface NewsHeadline {
  title: string;
  link: string;
  pubDate: string;
  source: string;
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

export async function fetchSecurityNews(options: {
  mode: "auto" | "categories" | "keyword";
  categories?: string[];
  keyword?: string;
}): Promise<NewsHeadline[]> {
  let searchTerms: string[] = [];

  if (options.mode === "auto") {
    searchTerms = [
      "home security alarm systems",
      "commercial security CCTV surveillance",
      "access control smart lock",
      "home automation security",
      "security industry trends technology",
    ];
  } else if (options.mode === "categories" && options.categories?.length) {
    searchTerms = options.categories.map((cat) => `${cat} security news`);
  } else if (options.mode === "keyword" && options.keyword) {
    searchTerms = [`${options.keyword} security`, options.keyword];
  } else {
    searchTerms = ["security alarm CCTV surveillance"];
  }

  const allHeadlines: NewsHeadline[] = [];
  const termsToFetch = searchTerms.slice(0, 5);

  for (const term of termsToFetch) {
    const encoded = encodeURIComponent(term);
    const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

    try {
      const response = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      });
      if (response.ok) {
        const xml = await response.text();
        const headlines = parseRSS(xml);
        allHeadlines.push(...headlines);
      }
    } catch (error) {
      console.error(`Failed to fetch feed for: ${term}`, error);
    }
  }

  const seen = new Set<string>();
  const unique = allHeadlines.filter((h) => {
    const key = h.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 20);
}
