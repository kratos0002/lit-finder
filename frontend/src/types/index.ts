/**
 * Type definitions for the application
 */

/**
 * Book interface
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  summary: string;
  category?: string;
  genre?: string;
  match_score?: number;
  image_url?: string;
  publication_date?: string;
  publisher?: string;
  isbn?: string;
}

/**
 * Review interface
 */
export interface Review {
  id: string;
  title: string;
  author: string;
  source: string;
  date: string;
  summary: string;
  url?: string;
  match_score?: number;
}

/**
 * Social post interface
 */
export interface SocialPost {
  id: string;
  title: string;
  author: string;
  source: string;
  date: string;
  summary: string;
  url?: string;
  match_score?: number;
}

/**
 * Recommendation request interface
 */
export interface RecommendationRequest {
  user_id: string;
  search_term: string;
  history?: string[];
  feedback?: {
    category: string;
    rating: string;
  }[];
  max_results?: number;
}

/**
 * Recommendation response interface
 */
export interface RecommendationResponse {
  top_book?: Book;
  top_review?: Review;
  top_social?: SocialPost;
  recommendations: Book[];
  trending?: any[];
  contextual_insights?: {
    thematic_connections?: string[];
    cultural_context?: string[];
    reading_pathways?: string[];
    critical_reception?: string[];
    academic_relevance?: string[];
    analysis?: string;
  };
  literary_analysis?: string;
} 