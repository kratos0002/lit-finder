import { RecommendationResponse } from "@/types";

// Add type definition for window.ENV
declare global {
  interface Window {
    ENV?: {
      VITE_API_BASE_URL?: string;
      VITE_API_KEY?: string;
    };
  }
}

// This service handles API calls to the render/recommend endpoint
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  console.log('API service: Getting recommendations for:', searchTerm);
  
  try {
    // Get API base URL from environment variables - with clearer debugging
    const windowEnvApiUrl = typeof window !== 'undefined' ? window.ENV?.VITE_API_BASE_URL : undefined;
    const importMetaApiUrl = import.meta.env.VITE_API_BASE_URL; 
    const fallbackApiUrl = 'https://alexandria-api.onrender.com';
    
    console.log('API URL resolution:');
    console.log('- window.ENV?.VITE_API_BASE_URL:', windowEnvApiUrl);
    console.log('- import.meta.env.VITE_API_BASE_URL:', importMetaApiUrl);
    console.log('- fallback API URL:', fallbackApiUrl);
    
    const apiBaseUrl = windowEnvApiUrl || importMetaApiUrl || fallbackApiUrl;
    
    // Get API key from environment variables - with clearer debugging
    const windowEnvApiKey = typeof window !== 'undefined' ? window.ENV?.VITE_API_KEY : undefined;
    const importMetaApiKey = import.meta.env.VITE_API_KEY;
    
    console.log('API Key resolution:');
    console.log('- window.ENV?.VITE_API_KEY exists:', !!windowEnvApiKey);
    console.log('- window.ENV?.VITE_API_KEY length:', windowEnvApiKey ? windowEnvApiKey.length : 0);
    console.log('- window.ENV?.VITE_API_KEY value:', windowEnvApiKey ? `${windowEnvApiKey.substring(0, 6)}...` : 'undefined');
    console.log('- import.meta.env.VITE_API_KEY exists:', !!importMetaApiKey);
    
    const apiKey = windowEnvApiKey || importMetaApiKey || '';
    
    // Update to use /api/recommendations as shown in the API documentation
    const url = `${apiBaseUrl}/api/recommendations`;
    
    // Log API configuration on startup (for debugging)
    console.log('Final API Configuration:');
    console.log(`- Base URL: ${apiBaseUrl}`);
    // More direct check for API key
    console.log(`- API Key: ${apiKey && apiKey.trim().length > 0 ? '✓ Set' : '✗ Not set'}`);
    console.log(`- API Key value check:`, apiKey ? `First 6 chars: ${apiKey.substring(0, 6)}...` : 'Empty');
    console.log(`- API Key length: ${apiKey ? apiKey.length : 0}`);
    
    // Prepare the request payload for the /api/recommendations endpoint
    const payload = {
      user_id: "web_user_" + Math.random().toString(36).substring(2, 10),
      search_term: searchTerm,  // Based on API documentation, it's search_term not query
      history: [],
      feedback: []
    };
    
    console.log('Sending request to:', url);
    console.log('With payload:', payload);
    
    // Prepare headers with API key
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Always add API key header if it exists and has length
    if (apiKey && apiKey.length > 0) {
      console.log('Using API key for authentication');
      headers['X-API-Key'] = apiKey;
    } else {
      console.warn('API key is empty or missing - this may cause authentication issues');
    }
    
    // Log the final headers being sent (without showing the actual API key value)
    console.log('Request headers:', Object.keys(headers).map(key => 
      key === 'X-API-Key' ? `${key}: [REDACTED]` : `${key}: ${headers[key]}`
    ));
    
    // Make the actual API call
    const response = await fetch(url, {
      method: 'POST',
      headers,
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
    
    // Process the response from the /recommend endpoint
    // The format might be different from our internal format, so we need to transform it
    let processedData: RecommendationResponse;
    
    try {
      if (data && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        console.log(`Found ${data.recommendations.length} recommendations from API`);
        
        // Map the API response to our expected format
        processedData = {
          top_book: data.top_book || null,
          top_review: data.top_review || null,
          top_social: data.top_social || null,
          recommendations: data.recommendations.map((item: any) => ({
            id: item.id || `rec-${Math.random().toString(36).substring(2, 10)}`,
            title: item.title,
            author: item.author || 'Unknown Author',
            coverImage: item.cover_image || item.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
            description: item.description || item.summary || '',
            summary: item.summary || item.description || '',
            category: item.category || 'General',
            matchScore: item.match_score || item.matchScore || 85,
            publicationDate: item.publication_date || item.publicationDate || '2023',
            source: item.source || 'api'
          }))
        };
        
        return processedData;
      } else {
        console.warn('API returned empty or invalid results, using fallback');
        return getFallbackRecommendations(searchTerm);
      }
    } catch (error) {
      console.error('Error processing API response:', error);
      return getFallbackRecommendations(searchTerm);
    }
  } catch (error) {
    console.error('Error calling recommendations API:', error);
    
    // In case of API failure, return fallback data
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
