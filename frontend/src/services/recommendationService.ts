import { RecommendationResponse } from "@/types";
import { getRecommendations as apiGetRecommendations } from "@/integrations/api/apiService";
import { mockReviews, mockSocialPosts } from "@/data/mockData";
import { searchBooks } from "@/services/bookService";

// Export a function that tries the API first, then falls back to mock
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  try {
    console.log('RecommendationService: Attempting to get recommendations from API for:', searchTerm);
    
    // First try the actual API
    const apiResponse = await apiGetRecommendations(searchTerm);
    
    // Improved validation to check for empty or invalid responses
    if (apiResponse && 
        apiResponse.recommendations && 
        apiResponse.recommendations.length > 0 &&
        apiResponse.top_book && 
        apiResponse.top_book.title) {
      console.log('RecommendationService: Successfully received API recommendations:', 
        apiResponse.recommendations.length, 'items');
      
      // Ensure top_review and top_social aren't null to prevent UI errors
      // If they are null, use mockData
      const response = {
        ...apiResponse,
        top_review: apiResponse.top_review || mockReviews[0] || null,
        top_social: apiResponse.top_social || mockSocialPosts[0] || null
      };
      
      // Additional logging for debugging
      console.log('RecommendationService: Final response structure:', 
        JSON.stringify({
          has_top_book: !!response.top_book,
          has_top_review: !!response.top_review,
          has_top_social: !!response.top_social,
          recommendations_count: response.recommendations?.length || 0
        })
      );
      
      return response;
    }
    
    // If API returned empty array or invalid response, use fallback
    console.warn('RecommendationService: API returned incomplete or no recommendations, using fallback');
    return await getMockRecommendations(searchTerm);
    
  } catch (error) {
    console.error('RecommendationService: API recommendation request failed, using fallback:', error);
    
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
    books.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    
    // Get the top book
    const topBook = books[0] || {
      id: "mock-id",
      title: "Sample Book",
      author: "Sample Author",
      coverImage: "https://source.unsplash.com/400x600/?book,novel",
      description: "This is a sample book description.",
      summary: "This is a sample book summary.",
      category: "Novel",
      match_score: 85,
      publicationDate: "2023",
      source: "fallback"
    };
    
    // Get a random review
    const topReview = mockReviews[0] || {
      id: "mock-review-id",
      title: "Sample Review",
      author: "Review Author",
      source: "Literary Journal",
      date: "2023-05-15",
      summary: "This is a sample review summary.",
      url: "https://example.com/review"
    };
    
    // Get a random social post
    const topSocial = mockSocialPosts[0] || {
      id: "mock-social-id",
      title: "Sample Social Post",
      author: "Social Media User",
      source: "Twitter",
      date: "2023-05-20",
      summary: "This is a sample social post summary.",
      url: "https://example.com/social"
    };
    
    // Mark all books explicitly as fallback source
    const fallbackBooks = books.map(book => ({
      ...book,
    }));
    
    // Prepare the response
    const response: RecommendationResponse = {
      top_book: topBook,
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
        summary: "We couldn't find specific books matching your search.",
        category: "Unknown",
        match_score: 50
      },
      recommendations: [{
        id: "fallback-id",
        title: `Books about ${searchTerm}`,
        author: "Unknown Author",
        summary: "We couldn't find specific books matching your search.",
        category: "Unknown",
        match_score: 50
      }],
      top_review: mockReviews[0],
      top_social: mockSocialPosts[0]
    };
  }
}
