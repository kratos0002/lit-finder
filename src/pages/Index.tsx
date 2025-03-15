
import { useState, useEffect } from "react";
import { Book } from "@/types";
import { categories } from "@/data/books";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { BookCard } from "@/components/BookCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { FeaturedBooks } from "@/components/FeaturedBooks";
import { BookOpen, RefreshCw, AlertCircle } from "lucide-react";
import { getBooks, getBooksByCategory, searchBooks } from "@/services/bookService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isBookDetailsOpen, setIsBookDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all books on initial load
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching initial books");
        const books = await getBooks();
        console.log(`Fetched ${books.length} initial books`);
        setAllBooks(books);
        setFilteredBooks(books);
      } catch (error) {
        console.error('Error fetching books:', error);
        toast({
          title: "Error loading books",
          description: "Unable to load books. Please try again later.",
          variant: "destructive",
        });
      } finally {
        // Simulate loading delay for animation purposes
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    };

    fetchBooks();
  }, [toast]);

  // Handle search query changes
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredBooks(allBooks);
      setSearchQuery("");
      return;
    }
    
    setSearchQuery(query);
    setIsSearching(true);
    setSearchError(null);
    
    try {
      console.log("Starting search for:", query);
      const results = await searchBooks(query);
      console.log(`Search returned ${results.length} results for "${query}"`);
      
      setFilteredBooks(results);
      
      // Refresh all books after a search to include new recommendations
      const updatedBooks = await getBooks();
      setAllBooks(updatedBooks);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term or browse categories",
        });
      } else if (results.length > 0) {
        toast({
          title: "Recommendations ready",
          description: `Found ${results.length} books matching "${query}"`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError("Failed to perform search. Please try again.");
      toast({
        title: "Search error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = async (category: string | null) => {
    setSelectedCategory(category);
    
    try {
      if (category) {
        const results = await getBooksByCategory(category);
        setFilteredBooks(results);
      } else {
        setFilteredBooks(allBooks);
      }
    } catch (error) {
      console.error('Error fetching books by category:', error);
      toast({
        title: "Error",
        description: "Unable to filter by category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsBookDetailsOpen(true);
  };

  const handleCloseBookDetails = () => {
    setIsBookDetailsOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse flex flex-col items-center">
            <BookOpen className="w-12 h-12 text-foreground/30 animate-bounce" />
            <p className="mt-4 text-foreground/50">Loading your literary journey...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
          <header className="mb-8 text-center animate-slide-down">
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-secondary rounded-full">
              Discover your next favorite book
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Curated Book Recommendations
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our handpicked selection of books across various genres, tailored to expand your horizons and ignite your imagination.
            </p>
          </header>

          <div className="mb-10 relative">
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
          </div>

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                <p className="mt-4 text-lg">Searching for recommendations...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
            </div>
          )}

          {searchError && !isSearching && (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{searchError}</p>
            </div>
          )}

          {!isSearching && !searchError && (
            <>
              {filteredBooks.length > 0 && (
                <section className="mb-16 animate-scale-in">
                  <FeaturedBooks books={filteredBooks.slice(0, 3)} onSelectBook={handleSelectBook} />
                </section>
              )}

              <section className="mb-6">
                <CategoryFilter 
                  categories={categories} 
                  selectedCategory={selectedCategory} 
                  onSelectCategory={handleCategorySelect} 
                />
              </section>

              {filteredBooks.length > 0 ? (
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 stagger-animate">
                  {filteredBooks.map((book) => (
                    <div key={book.id} onClick={() => handleSelectBook(book)}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </section>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No books found matching your search.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      handleCategorySelect(null);
                    }}
                    className="mt-4 text-sm underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}

          <BookDetailsModal 
            book={selectedBook} 
            isOpen={isBookDetailsOpen} 
            onClose={handleCloseBookDetails} 
          />
        </div>
      )}
    </div>
  );
};

export default Index;
