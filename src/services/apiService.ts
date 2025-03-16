
import { RecommendationResponse } from "@/types";

// This is a mock implementation of the API service
// In a real application, this would make actual API calls to your backend
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  console.log('Mock API service: Getting recommendations for:', searchTerm);
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return mock data
      resolve({
        recommendations: [
          {
            id: "mock-1",
            title: `Book about ${searchTerm}`,
            author: "Example Author",
            coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
            description: `A fascinating book related to ${searchTerm}.`,
            summary: `A fascinating book related to ${searchTerm}.`,
            category: "Fiction",
            matchScore: 90,
            publicationDate: "2023",
            source: "fallback"
          }
        ]
      });
    }, 1000); // Simulate network delay
  });
};
