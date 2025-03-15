
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { RecommendationRequest, RecommendationResponse } from "@/types";

// Get API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alexandria-api.onrender.com';
const API_KEY = import.meta.env.VITE_API_KEY;

// Generate or retrieve a user ID
export const getUserId = async (): Promise<string> => {
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
export const getSearchHistory = (): string[] => {
  const historyJson = localStorage.getItem('searchHistory');
  if (historyJson) {
    return JSON.parse(historyJson);
  }
  return [];
};

// Save search term to history
export const saveSearchTerm = async (term: string): Promise<void> => {
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
      // If we have feedback data, we would include it here
      // feedback: feedbackData
    };
    
    console.log('Request payload:', requestPayload);
    
    // Set up headers with API key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY;
    } else {
      console.warn('API key not found in environment variables');
    }
    
    console.log(`Sending request to ${API_BASE_URL}/api/recommendations`);
    
    // Make the API request
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestPayload),
    });
    
    // Log the response time for debugging
    console.log(`API response received in ${performance.now()}ms`);
    
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      } else if (response.status === 504) {
        throw new Error('Request timed out. Please try again.');
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    
    const data = await response.json();
    console.log('API response data:', data);
    
    return data as RecommendationResponse;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

// Get trending items from the API
export const getTrendingItems = async (searchHistory: string[] = []): Promise<{ items: any[] }> => {
  try {
    console.log('Getting trending items with history:', searchHistory);
    
    // Prepare request payload
    const userId = await getUserId();
    
    const requestPayload = {
      user_id: userId,
      search_history: searchHistory,
    };
    
    // Set up headers with API key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY;
    } else {
      console.warn('API key not found in environment variables');
    }
    
    console.log(`Sending request to ${API_BASE_URL}/api/trending`);
    
    // Make the API request
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/api/trending`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestPayload),
    });
    
    // Log the response time for debugging
    const endTime = performance.now();
    console.log(`API response received in ${endTime - startTime}ms`);
    
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      } else if (response.status === 504) {
        throw new Error('Request timed out. Please try again.');
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    
    const data = await response.json();
    console.log('API response data:', data);
    
    return data;
  } catch (error) {
    console.error('Error getting trending items:', error);
    throw error;
  }
};
