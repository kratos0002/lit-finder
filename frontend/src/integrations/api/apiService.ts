
import { toast } from "@/components/ui/use-toast";
import { RecommendationResponse } from "@/types";

// Get API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alexandria-api.onrender.com';
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
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', errorData || response.statusText);
        throw new Error(errorData?.message || `API request failed with status ${response.status}`);
      }
      
      return await response.json();
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
 * @returns Promise containing the recommendation response
 */
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  try {
    console.log(`Requesting recommendations for: "${searchTerm}"`);
    
    return await apiService.post('/api/recommendations', {
      user_id: 'web_user_' + Math.random().toString(36).substring(2, 10), // Generate random user ID
      search_term: searchTerm,
      history: [], // Add empty history
      feedback: [] // Add empty feedback
    });
  } catch (error) {
    console.error('Error fetching recommendations from API:', error);
    throw error;
  }
};
