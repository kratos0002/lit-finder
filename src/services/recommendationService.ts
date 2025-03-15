
import { Book, RecommendationRequest, RecommendationResponse, Review, SocialPost } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { searchBooks } from "@/services/bookService";
import { mockReviews, mockSocialPosts } from "@/data/mockData";

// Generate or retrieve a user ID
const getUserId = async (): Promise<string> => {
  // Check if user is authenticated
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user?.id) {
    return session.session.user.id;
  }
  
  // If not authenticated, get or create ID from localStorage
  let anonymousId = localStorage.getItem('anonymousUserId');
  if (!anonymousId) {
    anonymousId = uuidv4();
    localStorage.setItem('anonymousUserId', anonymousId);
  }
  
  return anonymousId;
};

// Get search history from localStorage
const getSearchHistory = (): string[] => {
  // Get history from localStorage
  const historyJson = localStorage.getItem('searchHistory');
  if (historyJson) {
    return JSON.parse(historyJson);
  }
  return [];
};

// Save search term to history
const saveSearchTerm = async (term: string): Promise<void> => {
  // Save to localStorage
  let history: string[] = [];
  const historyJson = localStorage.getItem('searchHistory');
  
  if (historyJson) {
    history = JSON.parse(historyJson);
  }
  
  // Add new term at the beginning and limit to 5 items
  history = [term, ...history.filter(item => item !== term)].slice(0, 5);
  localStorage.setItem('searchHistory', JSON.stringify(history));
};

// Get recommendations from the API
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  try {
    console.log('Getting recommendations for:', searchTerm);
    
    if (!searchTerm || searchTerm.trim() === '') {
      throw new Error('Search term is empty');
    }
    
    // Save search term to history
    await saveSearchTerm(searchTerm);
    
    // Prepare request payload
    const userId = await getUserId();
    const history = getSearchHistory();
    
    const requestPayload: RecommendationRequest = {
      user_id: userId,
      search_term: searchTerm,
      history: history,
    };
    
    console.log('Request payload:', requestPayload);
    
    // Here we would fetch recommendations from the API
    // For now, we'll use a mock response since the actual API endpoint isn't ready
    
    // In the future, implement actual API call:
    // const response = await fetch('/api/recommendations', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(requestPayload),
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`API request failed with status ${response.status}`);
    // }
    // 
    // const data = await response.json();
    // return data;

    // For now, fallback to using the existing search functionality
    return await getMockRecommendations(searchTerm);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

// Temporary mock function to simulate the new API using existing search
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
