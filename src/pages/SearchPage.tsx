
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { BookCard } from "@/components/BookCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { mockBooks } from "@/data/mockData";
import { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // In a real app, we would fetch the saved books from a backend
  // For now, we'll use a local state to simulate this
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      // Filter books that match the search query (case insensitive)
      const results = mockBooks.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No books found matching "${searchQuery}".`,
        });
      }
    }, 1000); // Simulate a delay
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
      <div className="max-w-6xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Advanced Search</h1>
          <p className="text-muted-foreground mb-6">
            Search for books, authors, topics, or themes to get personalized recommendations.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <Input
              type="text"
              placeholder="Enter a book title, author, topic, or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isSearching}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>
        </section>

        {searchResults.length > 0 ? (
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
        ) : searchQuery && !isSearching ? (
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
