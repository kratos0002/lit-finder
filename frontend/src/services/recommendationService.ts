
import { RecommendationResponse } from "@/types";
import { getRecommendations as apiGetRecommendations } from "@/services/apiService";
import { mockReviews, mockSocialPosts } from "@/data/mockData";
import { searchBooks } from "@/services/bookService";

// Export a function that tries the API first, then falls back to mock
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  try {
    console.log('Attempting to get recommendations from API for:', searchTerm);
    
    // First try the actual API
    const apiResponse = await apiGetRecommendations(searchTerm);
    
    // If the API returned a valid response with recommendations, return it
    if (apiResponse && apiResponse.recommendations && apiResponse.recommendations.length > 0) {
      console.log('Successfully received API recommendations');
      return apiResponse;
    }
    
    // If API returned empty array but a valid response, return it with a message
    if (apiResponse && (!apiResponse.recommendations || apiResponse.recommendations.length === 0)) {
      console.log('API returned no recommendations, using fallback');
      return await getMockRecommendations(searchTerm);
    }
    
    // If we get here, something went wrong with the API response
    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('API recommendation request failed, using fallback:', error);
    
    // If API fails, use our mock implementation as fallback
    return await getMockRecommendations(searchTerm);
  }
};

// This function will be used as a fallback if the API fails
async function getMockRecommendations(searchTerm: string): Promise<RecommendationResponse> {
  try {
    console.log('Getting mock recommendations for:', searchTerm);
    
    // Use the existing search function
    const books = await searchBooks(searchTerm);
    console.log('Found books:', books);
    
    // Sort by match score
    books.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    
    // Get the top book
    const topBook = books[0] || {
      id: "mock-id",
      title: "Sample Book",
      author: "Sample Author",
      coverImage: "https://source.unsplash.com/400x600/?book,novel",
      description: "This is a sample book description.",
      summary: "This is a sample book summary.",
      category: "Novel",
      matchScore: 85,
      publicationDate: "2023",
      source: "fallback"
    };
    
    // Get a random review
    const topReview = mockReviews[0] || {
      id: "mock-review-id",
      title: "Sample Review",
      source: "Literary Journal",
      date: "2023-05-15",
      summary: "This is a sample review summary.",
      link: "https://example.com/review"
    };
    
    // Get a random social post
    const topSocial = mockSocialPosts[0] || {
      id: "mock-social-id",
      title: "Sample Social Post",
      source: "Twitter",
      date: "2023-05-20",
      summary: "This is a sample social post summary.",
      link: "https://example.com/social"
    };
    
    // Mark all books explicitly as fallback source
    const fallbackBooks = books.map(book => ({
      ...book,
      source: "fallback" as const
    }));
    
    // Prepare the response
    const response: RecommendationResponse = {
      top_book: {...topBook, source: "fallback"},
      top_review: topReview,
      top_social: topSocial,
      recommendations: fallbackBooks.length > 0 ? fallbackBooks.slice(0, 10) : [topBook]
    };
    
    console.log('Mock response prepared:', response);
    return response;
  } catch (error) {
    console.error('Error in mock recommendations:', error);
    
    // If even the fallback fails, return a minimal valid response
    return {
      top_book: {
        id: "fallback-id",
        title: `Books about ${searchTerm}`,
        author: "Unknown Author",
        coverImage: "https://source.unsplash.com/400x600/?book,novel",
        description: "We couldn't find specific books matching your search.",
        summary: "We couldn't find specific books matching your search.",
        category: "Unknown",
        matchScore: 50,
        publicationDate: "Unknown",
        source: "fallback"
      },
      recommendations: [{
        id: "fallback-id",
        title: `Books about ${searchTerm}`,
        author: "Unknown Author",
        coverImage: "https://source.unsplash.com/400x600/?book,novel",
        description: "We couldn't find specific books matching your search.",
        summary: "We couldn't find specific books matching your search.",
        category: "Unknown",
        matchScore: 50,
        publicationDate: "Unknown",
        source: "fallback"
      }],
      top_review: null,
      top_social: null
    };
  }
}
