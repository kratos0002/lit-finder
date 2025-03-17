import { RecommendationResponse } from "@/types";
import { apiService, getRecommendations as apiIntegrationGetRecommendations } from "@/integrations/api/apiService";

// Add type definition for window.ENV
declare global {
  interface Window {
    ENV?: {
      VITE_API_BASE_URL?: string;
      VITE_API_KEY?: string;
    };
  }
}

/**
 * Wrapper for the API implementation in integrations/api/apiService
 * This delegates to the proper implementation to avoid duplication
 */
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  console.log('apiService: Delegating getRecommendations call to integrations/api/apiService');
  try {
    return await apiIntegrationGetRecommendations(searchTerm);
  } catch (error) {
    console.error('Error in apiService wrapper, using fallback:', error);
    return getFallbackRecommendations(searchTerm);
  }
};

// Fallback function for when the API fails or returns empty results
function getFallbackRecommendations(searchTerm: string): RecommendationResponse {
  console.log('Using fallback recommendations for:', searchTerm);
  
  // Create a book based on the search term
  const mockBook = {
    id: "mock-1",
    title: `Book about ${searchTerm}`,
    author: "Example Author",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
    description: `A fascinating book related to ${searchTerm}.`,
    summary: `A fascinating book related to ${searchTerm}.`,
    category: "Fiction",
    matchScore: 90,
    publicationDate: "2023",
    source: "fallback" as "fallback" // Type assertion to match the expected union type
  };
  
  // Create a mock review
  const mockReview = {
    id: "mock-review-1",
    title: `Review of books about ${searchTerm}`,
    author: "Review Author",
    source: "Literary Magazine",
    date: "2023-05-15",
    summary: `An insightful review of literature related to ${searchTerm}.`,
    link: "https://example.com/review"
  };
  
  // Create a mock social post
  const mockSocial = {
    id: "mock-social-1",
    title: `Trending discussions about ${searchTerm}`,
    author: "Social Media User",
    source: "Twitter",
    date: "2023-06-20",
    summary: `See what readers are saying about ${searchTerm} on social media.`,
    link: "https://example.com/social"
  };
  
  // Return mock data with the complete structure
  return {
    top_book: mockBook,
    top_review: mockReview,
    top_social: mockSocial,
    recommendations: [
      mockBook,
      // Add a few more mock books with variations
      {
        id: "mock-2",
        title: `Another book about ${searchTerm}`,
        author: "Second Author",
        coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop",
        description: `A different perspective on ${searchTerm}.`,
        summary: `A different perspective on ${searchTerm}.`,
        category: "Non-fiction",
        matchScore: 85,
        publicationDate: "2022",
        source: "fallback" as "fallback"
      },
      {
        id: "mock-3",
        title: `${searchTerm}: A Comprehensive Guide`,
        author: "Third Author",
        coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
        description: `Everything you need to know about ${searchTerm}.`,
        summary: `Everything you need to know about ${searchTerm}.`,
        category: "Reference",
        matchScore: 80,
        publicationDate: "2021",
        source: "fallback" as "fallback"
      }
    ]
  };
}

// Function to get trending items - COMPLETELY ISOLATED MOCK IMPLEMENTATION 
export const getTrendingItems = async (searchHistory: string[] = []): Promise<{ items: any[] }> => {
  console.log('Getting mock trending items only (NO API CALLS):', searchHistory);
  
  // Never attempt to call any API endpoints - this is mock data only
  return {
    items: [
      {
        id: "trend-1",
        title: "The Rise of AI in Literature",
        description: "How artificial intelligence is changing the way we discover and read books",
        category: "Technology",
        source: "Literary Review",
        url: "https://example.com/ai-literature",
        published_at: new Date().toISOString()
      },
      {
        id: "trend-2",
        title: "Top Summer Reads for 2025",
        description: "The most anticipated books coming this summer",
        category: "Reading Lists",
        source: "BookReviews",
        url: "https://example.com/summer-reads",
        published_at: new Date().toISOString()
      },
      {
        id: "trend-3",
        title: "Classic Literature in the Digital Age",
        description: "How digital platforms are bringing classics to new audiences",
        category: "Digital",
        source: "Literary Digest",
        url: "https://example.com/classics-digital",
        published_at: new Date().toISOString()
      },
      {
        id: "trend-4", 
        title: "Reading Habits in the Digital Age",
        description: "How modern readers are adapting to new formats and platforms",
        category: "Research",
        source: "Book Analytics",
        url: "https://example.com/reading-habits",
        published_at: new Date().toISOString()
      }
    ]
  };
};
