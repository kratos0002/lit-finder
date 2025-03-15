
export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  summary: string;
  category: string;
  tags?: string[];
  matchScore: number;
  publicationDate: string;
  source: "perplexity" | "openai" | "goodreads";
}

export interface Review {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  link: string;
}

export interface SocialPost {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  link: string;
}

export interface FeedbackMessage {
  id: string;
  userId: string;
  type: "feature" | "issue" | "other";
  message: string;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
}
