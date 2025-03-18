import { toast } from "@/components/ui/use-toast";
import { RecommendationResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY;

// Log API configuration on startup (for debugging)
console.log('API Configuration:');
console.log(`- Base URL: ${API_BASE_URL}`);
console.log(`- API Key: ${API_KEY ? '✓ Set' : '✗ Not set'}`);

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Base API service for making requests to the Alexandria API
 */
export const apiService = {
  /**
   * Sends a request to the API
   */
  async fetchFromAPI(endpoint: string, options: FetchOptions = {}) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Add API key if available
      if (API_KEY) {
        headers['X-API-Key'] = API_KEY;
        console.log('Using API Key for request');
      } else {
        console.warn('No API Key found in environment variables');
      }
      
      console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
      console.log('Request headers:', headers);
      
      // Add timeout to avoid hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('API Error:', errorData || response.statusText);
          throw new Error(errorData?.message || `API request failed with status ${response.status}`);
        }
        
        // Try to get the response as JSON first
        try {
          const responseData = await response.json();
          console.log('Response received successfully as JSON');
          return responseData;
        } catch (jsonError) {
          // If JSON parsing fails, try to extract JSON from markdown
          console.warn('Failed to parse response as JSON, trying to extract from text', jsonError);
          const text = await response.clone().text();
          
          // Try to extract JSON from the text (might be in a markdown code block)
          const extractedJson = extractJsonFromText(text);
          if (extractedJson) {
            console.log('Successfully extracted JSON from text response');
            return extractedJson;
          }
          
          // If we couldn't extract JSON, rethrow the original error
          throw new Error('API returned invalid JSON response');
        }
      } catch (fetchError: any) {
        // Clear the timeout if there was an error
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('API request timed out after 60 seconds');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('API request error:', error);
      toast({
        title: "API Request Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  },
  
  /**
   * Sends a GET request to the API
   */
  async get(endpoint: string, headers = {}) {
    return this.fetchFromAPI(endpoint, { headers });
  },
  
  /**
   * Sends a POST request to the API
   */
  async post(endpoint: string, data: any, headers = {}) {
    return this.fetchFromAPI(endpoint, {
      method: 'POST',
      headers,
      body: data,
    });
  }
};

/**
 * Gets book recommendations from the Alexandria API
 * @param searchTerm - The book title, author, or subject to search for
 * @param userId - The ID of the current user
 * @returns Promise containing the recommendation response
 */
export const getRecommendations = async (searchTerm: string, userId: string): Promise<RecommendationResponse> => {
  try {
    console.log(`Requesting recommendations for: "${searchTerm}"`);
    
    // Prepare the payload
    const payload = {
      user_id: userId,
      search_term: searchTerm,
      max_results: 10
    };
    
    console.log('Recommendation payload prepared:', payload);
    
    // Make the request
    return await apiService.post('/api/recommendations', payload);
  } catch (error) {
    console.error('Error fetching recommendations from API:', error);
    throw error;
  }
};

/**
 * Gets all books saved by a user
 * @param userId - The ID of the current user
 * @returns Promise containing the list of saved books
 */
export const getSavedBooks = async (userId: string): Promise<any[]> => {
  try {
    console.log(`Fetching saved books for user: "${userId}"`);
    return await apiService.get(`/api/recommendations/saved/${userId}`);
  } catch (error) {
    console.error('Error fetching saved books:', error);
    throw error;
  }
};

/**
 * Saves a book to a user's collection
 * @param userId - The ID of the current user
 * @param bookId - The ID of the book to save
 * @returns Promise containing the save operation result
 */
export const saveBook = async (userId: string, bookId: string): Promise<any> => {
  try {
    console.log(`Saving book ${bookId} for user: "${userId}"`);
    return await apiService.post('/api/recommendations/save', {
      user_id: userId,
      book_id: bookId
    });
  } catch (error) {
    console.error('Error saving book:', error);
    throw error;
  }
};

/**
 * Saves user feedback for improving recommendations
 * @param userId - The ID of the current user
 * @param feedbackType - The type of feedback (e.g., 'like', 'dislike', 'search')
 * @param message - The feedback message
 * @param bookId - Optional ID of the book the feedback is about
 * @returns Promise containing the feedback operation result
 */
export const saveFeedback = async (
  userId: string,
  feedbackType: string,
  message: string,
  bookId?: string
): Promise<any> => {
  try {
    console.log(`Saving feedback for user: "${userId}"`);
    return await apiService.post('/api/recommendations/feedback', {
      user_id: userId,
      feedback_type: feedbackType,
      message,
      book_id: bookId
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

// Helper function to extract JSON from text/markdown responses
function extractJsonFromText(text: string): any {
  // Try to find JSON in markdown code blocks (```json ... ```)
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonBlockRegex);
  
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      console.error('Failed to parse JSON from code block:', e);
    }
  }
  
  // If not in code blocks, try to find anything that looks like JSON
  const jsonRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
  const generalMatch = text.match(jsonRegex);
  
  if (generalMatch && generalMatch[1]) {
    try {
      return JSON.parse(generalMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse JSON from general text:', e);
    }
  }
  
  return null;
}
