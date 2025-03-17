import { toast } from "@/components/ui/use-toast";
import { RecommendationResponse } from "@/types";
import { logVersion } from "@/utils/debugTools";

// Add type definition for window.ENV if it doesn't exist
declare global {
  interface Window {
    ENV?: {
      VITE_API_BASE_URL?: string;
      VITE_API_KEY?: string;
    };
  }
}

// API Integration Version - increment to force cache invalidation on deployment
const API_INTEGRATION_VERSION = '1.0.1';

// Get API configuration from environment variables
const getApiKey = () => {
  // First try window.ENV (set by Vercel build for production)
  if (typeof window !== 'undefined' && window.ENV?.VITE_API_KEY) {
    console.log('API Key found in window.ENV');
    return window.ENV.VITE_API_KEY;
  }
  // Then try import.meta.env (for local development)
  if (import.meta.env.VITE_API_KEY) {
    console.log('API Key found in import.meta.env');
    return import.meta.env.VITE_API_KEY;
  }
  // Default development API key - only for testing
  console.log('Using default development API key');
  return 'alexandria-dev-3245';
};

const getApiBaseUrl = () => {
  // First try window.ENV
  if (typeof window !== 'undefined' && window.ENV?.VITE_API_BASE_URL) {
    return window.ENV.VITE_API_BASE_URL;
  }
  // Then try import.meta.env
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Default
  return 'https://alexandria-api.onrender.com';
};

// Initialize API configuration values
const API_BASE_URL = getApiBaseUrl();
const API_KEY = getApiKey();

// Log API configuration on startup (for debugging)
console.log('==================================================');
console.log(`API INTEGRATION SERVICE v${API_INTEGRATION_VERSION} - LOADED`);
console.log('==================================================');
console.log('API Integration Service Configuration:');
console.log(`- Base URL: ${API_BASE_URL}`);
console.log(`- API Key: ${API_KEY ? '✓ Set' : '✗ Not set'}`);
console.log(`- API Key Value: ${API_KEY ? API_KEY.substring(0, 6) + '...' : 'Not set'}`);
console.log(`- API Key Length: ${API_KEY ? API_KEY.length : 0}`);

if (typeof window !== 'undefined') {
  console.log('- window.ENV:', window.ENV || 'Not defined');
  if (window.ENV) {
    console.log('- window.ENV.VITE_API_KEY exists:', !!window.ENV.VITE_API_KEY);
    console.log('- window.ENV.VITE_API_KEY length:', window.ENV.VITE_API_KEY ? window.ENV.VITE_API_KEY.length : 0);
  }
}
console.log('- import.meta.env.VITE_API_KEY exists:', !!import.meta.env.VITE_API_KEY);

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
      console.log(`API Integration: Preparing request to ${endpoint}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Add API key if available - always use the current value
      const currentApiKey = getApiKey();
      if (currentApiKey) {
        headers['X-API-Key'] = currentApiKey;
        console.log('API Integration: Using API Key for request');
      } else {
        console.warn('API Integration: No API Key found in environment variables');
      }
      
      console.log(`API Integration: Making request to: ${API_BASE_URL}${endpoint}`);
      console.log('API Integration: Request headers:', Object.keys(headers).map(key => 
        key === 'X-API-Key' ? `${key}: [REDACTED]` : `${key}: ${headers[key]}`
      ));
      
      if (options.body) {
        console.log('API Integration: Request body:', typeof options.body === 'string' 
          ? options.body 
          : JSON.stringify(options.body));
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('API Error Details:', errorData);
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // If can't parse as JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('API Error Text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error('Could not read error response');
          }
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('API Integration: Response received successfully');
      return responseData;
    } catch (error) {
      console.error('API Integration: Request error:', error);
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
    console.log(`API Integration: POST request to ${endpoint} with data:`, data);
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
    console.log(`API Integration: Requesting recommendations for: "${searchTerm}"`);
    
    // Generate a random user ID for tracking
    const userId = 'web_user_' + Math.random().toString(36).substring(2, 10);
    console.log(`API Integration: Using user ID: ${userId}`);
    
    // Get search history from localStorage if available
    let history: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const storedHistory = localStorage.getItem('searchHistory');
        if (storedHistory) {
          history = JSON.parse(storedHistory);
          console.log('API Integration: Retrieved search history:', history);
        }
      } catch (e) {
        console.warn('API Integration: Could not retrieve search history:', e);
      }
    }
    
    // Prepare the payload
    const payload = {
      user_id: userId,
      search_term: searchTerm,
      history: history.slice(0, 5), // Only use the 5 most recent searches
      feedback: [] // Add empty feedback
    };
    
    console.log('API Integration: Recommendation payload prepared:', payload);
    
    // Make the request
    return await apiService.post('/api/recommendations', payload);
  } catch (error) {
    console.error('API Integration: Error fetching recommendations:', error);
    throw error;
  }
};
