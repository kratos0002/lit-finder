
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { BookCard } from "@/components/BookCard";
import { InsightCard } from "@/components/InsightCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { Book, RecommendationResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommendationInput } from "@/components/RecommendationInput";
import { getRecommendations } from "@/services/recommendationService";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
    queryFn: () => searchQuery ? getRecommendations(searchQuery) : null,
    enabled: false, // Don't fetch on component mount
  });

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

  const handleGetRecommendations = async (query: string) => {
    setSearchQuery(query);
    refetch();
  };

  const handleHistoryTagClick = (query: string) => {
    setSearchQuery(query);
    refetch();
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
            <section className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Top Picks for You</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Book Card */}
                <div className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl">
                  <BookCard 
                    book={recommendations.top_book}
                    onClick={() => handleBookClick(recommendations.top_book)}
                    onSave={handleSaveBook}
                    isSaved={isBookSaved(recommendations.top_book)}
                  />
                </div>
                
                {/* Top Review Card */}
                <div className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl" style={{ animationDelay: '0.1s' }}>
                  <InsightCard item={recommendations.top_review} type="review" />
                </div>
                
                {/* Top Social Post Card */}
                <div className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl" style={{ animationDelay: '0.2s' }}>
                  <InsightCard item={recommendations.top_social} type="social" />
                </div>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">More Recommendations</h2>
                <Button variant="outline" size="sm" className="gap-1">
                  See All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Tabs defaultValue="all" className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {/* Generate tabs for unique categories */}
                  {[...new Set(recommendations.recommendations.map(book => book.category))].map(category => (
                    <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="all" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {recommendations.recommendations.map((book, index) => (
                      <div 
                        key={book.id} 
                        className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl"
                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                      >
                        <BookCard 
                          book={book} 
                          onClick={() => handleBookClick(book)}
                          onSave={handleSaveBook}
                          isSaved={isBookSaved(book)}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                {/* Content for each category tab */}
                {[...new Set(recommendations.recommendations.map(book => book.category))].map(category => (
                  <TabsContent key={category} value={category} className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {recommendations.recommendations
                        .filter(book => book.category === category)
                        .map((book, index) => (
                          <div 
                            key={book.id} 
                            className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl"
                            style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                          >
                            <BookCard 
                              book={book} 
                              onClick={() => handleBookClick(book)}
                              onSave={handleSaveBook}
                              isSaved={isBookSaved(book)}
                            />
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          </div>
        )}

        {!recommendations && !isLoading && (
          <section className="py-12 flex flex-col items-center justify-center text-center">
            <div className="mb-8 text-muted-foreground">
              <p className="text-xl mb-2">Enter a literary work you enjoy to get started</p>
              <p>For example: "science fiction like three body problem" or "mystery novels similar to Sherlock Holmes"</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Badge className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" onClick={() => setSearchQuery("dystopian fiction like 1984")}>
                Dystopian fiction like 1984
              </Badge>
              <Badge className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" onClick={() => setSearchQuery("philosophical novels")}>
                Philosophical novels
              </Badge>
              <Badge className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" onClick={() => setSearchQuery("magical realism like Gabriel García Márquez")}>
                Magical realism
              </Badge>
              <Badge className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" onClick={() => setSearchQuery("classic Russian literature")}>
                Classic Russian literature
              </Badge>
              <Badge className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" onClick={() => setSearchQuery("science fiction with AI themes")}>
                Science fiction with AI themes
              </Badge>
              <Badge className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" onClick={() => setSearchQuery("poetry collections")}>
                Poetry collections
              </Badge>
            </div>
          </section>
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
