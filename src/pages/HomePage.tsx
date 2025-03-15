
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { Book, RecommendationResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { RecommendationInput } from "@/components/RecommendationInput";
import { getRecommendations } from "@/services/recommendationService";
import { Loader2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TopPicksSection } from "@/components/TopPicksSection";
import { RecommendationsGrid } from "@/components/RecommendationsGrid";
import { SuggestedQueries } from "@/components/SuggestedQueries";
import { TrendingSection } from "@/components/TrendingSection"; // Import the new component

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { toast } = useToast();

  // Use React Query for recommendations
  const {
    data: recommendations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recommendations', searchQuery],
    queryFn: () => getRecommendations(searchQuery),
    enabled: searchQuery !== "", // Enable the query when search query is not empty
  });

  console.log("Current search query:", searchQuery);
  console.log("Is loading:", isLoading);
  console.log("Recommendations:", recommendations);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const loadSearchHistory = () => {
      const historyJson = localStorage.getItem('searchHistory');
      if (historyJson) {
        setSearchHistory(JSON.parse(historyJson));
      }
    };
    
    loadSearchHistory();
  }, []);

  // Save or update search history
  useEffect(() => {
    if (searchQuery && recommendations) {
      // Only add to history if the search returned results
      const updatedHistory = [searchQuery, ...searchHistory.filter(term => term !== searchQuery)].slice(0, 10);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
  }, [recommendations, searchQuery]);

  const handleGetRecommendations = async (query: string) => {
    if (!query.trim()) return;
    
    console.log("Getting recommendations for:", query);
    setSearchQuery(query);
  };

  const handleHistoryTagClick = (query: string) => {
    setSearchQuery(query);
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleSaveBook = async (book: Book) => {
    if (savedBooks.some(savedBook => savedBook.id === book.id)) {
      toast({
        title: "Already saved",
        description: `"${book.title}" is already in your saved books.`,
      });
      return;
    }

    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session?.user) {
      try {
        // Save to Supabase if authenticated
        const { error } = await supabase
          .from('saved_books')
          .insert({ book_id: book.id, user_id: session.session.user.id });
          
        if (error) throw error;
      } catch (error) {
        console.error("Error saving book:", error);
        toast({
          title: "Error saving book",
          description: "An error occurred while saving the book.",
          variant: "destructive",
        });
        return;
      }
    }

    setSavedBooks([...savedBooks, book]);
    toast({
      title: "Book saved",
      description: `"${book.title}" has been added to your books.`,
    });
  };

  const isBookSaved = (book: Book) => {
    return savedBooks.some(savedBook => savedBook.id === book.id);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4">
        <section className="mb-8 mt-10 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent mb-4">
            Discover Your Next Literary Journey
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Our intelligent recommendation engine suggests books tailored to your interests.
          </p>
          
          <div className="max-w-2xl mx-auto">
            <RecommendationInput onSubmit={handleGetRecommendations} isLoading={isLoading} />
            
            {/* Search History Tags */}
            {searchHistory.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <div className="w-full flex items-center justify-center gap-2 mb-2 text-sm text-muted-foreground">
                  <History className="h-4 w-4" />
                  <span>Recent Searches:</span>
                </div>
                {searchHistory.map((term, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="px-3 py-1 cursor-pointer hover:bg-primary/20 transition-colors duration-200"
                    onClick={() => handleHistoryTagClick(term)}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Add the Trending Section here */}
        <TrendingSection searchHistory={searchHistory} />

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg mb-8">
            <p className="text-destructive">Error loading recommendations. Please try again later.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Finding the perfect recommendations for you...</p>
          </div>
        )}

        {recommendations && !isLoading && (
          <div className="animate-fade-in">
            {/* Top Picks Section - showing the top book, review, and social post */}
            <TopPicksSection 
              topBook={recommendations.top_book}
              topReview={recommendations.top_review}
              topSocial={recommendations.top_social}
              onBookClick={handleBookClick}
              onSaveBook={handleSaveBook}
              isBookSaved={isBookSaved}
            />

            {/* More Recommendations Section - showing filtered recommendations */}
            <RecommendationsGrid 
              recommendations={recommendations.recommendations}
              onBookClick={handleBookClick}
              onSaveBook={handleSaveBook}
              isBookSaved={isBookSaved}
            />
          </div>
        )}

        {!recommendations && !isLoading && !searchQuery && (
          <SuggestedQueries onQuerySelect={handleGetRecommendations} />
        )}
      </div>

      <BookDetailsModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBook}
        isSaved={selectedBook ? isBookSaved(selectedBook) : false}
      />
    </MainLayout>
  );
}
