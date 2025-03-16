
import { RecommendationResponse } from "@/types";

// This service handles API calls to the render/recommend endpoint
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  console.log('API service: Getting recommendations for:', searchTerm);
  
  try {
    // Get API base URL from environment variables
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alexandria-api.onrender.com';
    const url = `${apiBaseUrl}/api/recommendations`;
    
    // Prepare the request payload
    const payload = {
      user_id: "web_user_" + Math.random().toString(36).substring(2, 10),
      search_term: searchTerm,
      history: [],
      feedback: []
    };
    
    console.log('Sending request to:', url);
    console.log('With payload:', payload);
    
    // Make the actual API call
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include API key if available
        ...(import.meta.env.VITE_API_KEY && {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
        })
      },
      body: JSON.stringify(payload)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    // Parse the response
    const data = await response.json();
    console.log('API response received:', data);
    
    // Transform API response to match our expected format if needed
    return {
      top_book: data.top_book || null,
      top_review: data.top_review || null,
      top_social: data.top_social || null,
      recommendations: data.recommendations || []
    };
  } catch (error) {
    console.error('Error calling recommendations API:', error);
    
    // In case of API failure, return fallback data
    return getFallbackRecommendations(searchTerm);
  }
};

// Fallback function for when the API fails
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
    source: "Literary Magazine",
    date: "2023-05-15",
    summary: `An insightful review of literature related to ${searchTerm}.`,
    link: "https://example.com/review"
  };
  
  // Create a mock social post
  const mockSocial = {
    id: "mock-social-1",
    title: `Trending discussions about ${searchTerm}`,
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
