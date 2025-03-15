
import { RecommendationResponse } from "@/types";
import { getRecommendations as apiGetRecommendations } from "@/services/apiService";
import { mockReviews, mockSocialPosts } from "@/data/mockData";
import { searchBooks } from "@/services/bookService";

// Export a function that tries the API first, then falls back to mock
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  try {
    console.log('Attempting to get recommendations from API for:', searchTerm);
    
    // First try the actual API
    return await apiGetRecommendations(searchTerm);
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
    books.sort((a, b) => b.matchScore - a.matchScore);
    
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
    
    // Prepare the response
    const response: RecommendationResponse = {
      top_book: topBook,
      top_review: topReview,
      top_social: topSocial,
      recommendations: books.slice(1, 11) // Take up to 10 additional recommendations
    };
    
    console.log('Mock response prepared:', response);
    return response;
  } catch (error) {
    console.error('Error in mock recommendations:', error);
    throw error;
  }
}
