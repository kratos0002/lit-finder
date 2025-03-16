
import { RecommendationResponse } from "@/types";

// This is a mock implementation of the API service
// In a real application, this would make actual API calls to your backend
export const getRecommendations = async (searchTerm: string): Promise<RecommendationResponse> => {
  console.log('Mock API service: Getting recommendations for:', searchTerm);
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a book based on the search term
      const mockBook = {
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
      };
      
      // Create a mock review
      const mockReview = {
        id: "mock-review-1",
        title: `Review of books about ${searchTerm}`,
        source: "Literary Magazine",
        date: "2023-05-15",
        summary: `An insightful review of literature related to ${searchTerm}.`,
        link: "https://example.com/review"
      };
      
      // Create a mock social post
      const mockSocial = {
        id: "mock-social-1",
        title: `Trending discussions about ${searchTerm}`,
        source: "Twitter",
        date: "2023-06-20",
        summary: `See what readers are saying about ${searchTerm} on social media.`,
        link: "https://example.com/social"
      };
      
      // Return mock data with the complete structure
      resolve({
        top_book: mockBook,
        top_review: mockReview,
        top_social: mockSocial,
        recommendations: [
          mockBook,
          // Add a few more mock books with variations
          {
            id: "mock-2",
            title: `Another book about ${searchTerm}`,
            author: "Second Author",
            coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop",
            description: `A different perspective on ${searchTerm}.`,
            summary: `A different perspective on ${searchTerm}.`,
            category: "Non-fiction",
            matchScore: 85,
            publicationDate: "2022",
            source: "fallback"
          },
          {
            id: "mock-3",
            title: `${searchTerm}: A Comprehensive Guide`,
            author: "Third Author",
            coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
            description: `Everything you need to know about ${searchTerm}.`,
            summary: `Everything you need to know about ${searchTerm}.`,
            category: "Reference",
            matchScore: 80,
            publicationDate: "2021",
            source: "fallback"
          }
        ]
      });
    }, 1000); // Simulate network delay
  });
};
