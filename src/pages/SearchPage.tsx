
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { BookCard } from "@/components/BookCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SearchX, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { searchBooks } from "@/services/bookService";

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setError(null);
    setIsSearching(true);
    setSearchResults([]);
    console.log("Searching for:", query);
    
    try {
      const results = await searchBooks(query);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No books found matching "${query}".`,
        });
      } else {
        toast({
          title: "Search complete",
          description: `Found ${results.length} books matching "${query}".`,
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setError(error.message || "An error occurred during search");
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleSaveBook = (book: Book) => {
    if (savedBooks.some(savedBook => savedBook.id === book.id)) {
      toast({
        title: "Already saved",
        description: `"${book.title}" is already in your saved books.`,
      });
      return;
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Advanced Search</h1>
          <p className="text-muted-foreground mb-6">
            Search for books, authors, topics, or themes to get personalized recommendations.
          </p>
          
          <SearchBar onSearch={handleSearch} isSearching={isSearching} />
        </section>

        {isSearching && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Searching for recommendations...</p>
          </div>
        )}

        {error && !isSearching && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-medium text-destructive mb-2">Error occurred</h3>
            <p className="text-destructive/80">{error}</p>
            <p className="mt-2 text-sm">Using fallback recommendations instead.</p>
          </div>
        )}

        {searchResults.length > 0 && !isSearching ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onClick={() => handleBookClick(book)}
                  onSave={handleSaveBook}
                  isSaved={isBookSaved(book)}
                />
              ))}
            </div>
          </div>
        ) : searchQuery && !isSearching && !error ? (
          <div className="text-center py-16 px-4">
            <SearchX className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try different keywords or browse our recommendations on the home page.
            </p>
          </div>
        ) : null}
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
