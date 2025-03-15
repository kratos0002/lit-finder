
import { useState, useEffect } from "react";
import { Book, categories, books, getBooksByCategory, searchBooks } from "@/data/books";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { BookCard } from "@/components/BookCard";
import { BookDetails } from "@/components/BookDetails";
import { FeaturedBooks } from "@/components/FeaturedBooks";
import { BookOpen } from "lucide-react";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isBookDetailsOpen, setIsBookDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for animation purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredBooks(searchBooks(searchQuery));
    } else if (selectedCategory) {
      setFilteredBooks(getBooksByCategory(selectedCategory));
    } else {
      setFilteredBooks(books);
    }
  }, [selectedCategory, searchQuery]);

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

          <div className="mb-10">
            <SearchBar onSearch={setSearchQuery} />
          </div>

          <section className="mb-16 animate-scale-in">
            <FeaturedBooks books={books} onSelectBook={handleSelectBook} />
          </section>

          <section className="mb-6">
            <CategoryFilter 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
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
                  setSelectedCategory(null);
                }}
                className="mt-4 text-sm underline"
              >
                Clear filters
              </button>
            </div>
          )}

          <BookDetails 
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
