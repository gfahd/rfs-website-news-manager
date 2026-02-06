// Shared article form data shape (New + Edit)
export interface ArticleData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seoKeywords: string[];
  coverImage: string;
  featured: boolean;
  publishedAt: string; // ISO date or YYYY-MM-DD
}
