
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
  source: "perplexity" | "openai" | "goodreads" | "fallback" | "api";
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

// Add a new interface for mouse event handlers
export interface MouseEventHandlers {
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

// New API response interfaces
export interface RecommendationRequest {
  user_id: string;
  search_term: string;
  history?: string[];
  feedback?: FeedbackItem[];
}

export interface FeedbackItem {
  category: string;
  rating: "positive" | "negative" | "neutral";
}

export interface RecommendationResponse {
  top_book: Book;
  top_review: Review;
  top_social: SocialPost;
  recommendations: Book[];
}
