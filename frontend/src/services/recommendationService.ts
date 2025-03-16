import { RecommendationResponse } from "@/types";
import { getRecommendations as apiGetRecommendations } from "@/integrations/api/apiService";
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
    
    // Create a mock recommendation response
    const response: RecommendationResponse = {
      top_book: books[0],
      top_review: mockReviews[0],
      top_social: mockSocialPosts[0],
      recommendations: books,
      trending: [
        {
          title: 'Rising popularity of literary fiction',
          source: 'Book Trends',
          url: 'https://example.com/trends/literary-fiction'
        },
        {
          title: 'New releases this month',
          source: 'Publisher Weekly',
          url: 'https://example.com/new-releases'
        }
      ],
      contextual_insights: {
        thematic_connections: [
          'Exploration of identity',
          'Moral ambiguity',
          'Social commentary'
        ],
        cultural_context: [
          'Post-modern literature',
          'Contemporary fiction'
        ],
        reading_pathways: [
          'Start with classic works',
          'Explore similar themes in different genres'
        ],
        critical_reception: [
          'Widely acclaimed by critics',
          'Controversial among traditional readers'
        ],
        academic_relevance: [
          'Frequently studied in contemporary literature courses'
        ],
        analysis: 'These works represent a significant contribution to modern literature, challenging conventional narratives while exploring universal themes.'
      },
      literary_analysis: 'The selected works demonstrate a sophisticated approach to narrative structure, with complex character development and thematic depth.'
    };
    
    return response;
  } catch (error) {
    console.error('Error generating mock recommendations:', error);
    
    // Return a minimal valid response if everything fails
    return {
      recommendations: []
    };
  }
}
