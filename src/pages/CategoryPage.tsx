import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { CategoryList } from "@/components/CategoryList";
import { BookCard } from "@/components/BookCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { categories } from "@/data/books";
import { searchBooks, saveBook, removeSavedBook, getSavedBooks } from "@/services/bookService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Book, Category } from "@/types";

const mapCategories = (): Category[] => {
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.id // The icon is mapped in the CategoryTag component
  }));
};

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId || null);
  const [books, setBooks] = useState<Book[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const mappedCategories = mapCategories();

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        // If categoryId is provided, search for books in that category
        // Otherwise, get all books
        const results = await searchBooks(selectedCategory || "");
        setBooks(results);
      } catch (error) {
        console.error("Error fetching books:", error);
        toast({
          title: "Error",
          description: "Failed to fetch books. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [selectedCategory, toast]);

  useEffect(() => {
    const loadSavedBooks = async () => {
      const userSavedBooks = await getSavedBooks(user?.id);
      setSavedBooks(userSavedBooks);
    };

    if (user) {
      loadSavedBooks();
    } else {
      // If no user, check localStorage
      const localSavedBooks = localStorage.getItem("savedBooks");
      if (localSavedBooks) {
        setSavedBooks(JSON.parse(localSavedBooks));
      }
    }
  }, [user]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    navigate(categoryId ? `/category/${categoryId}` : "/category", { replace: true });
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsDetailsOpen(true);
  };

  const handleBookSave = async (book: Book) => {
    try {
      if (isBookSaved(book.id)) {
        // Remove book from saved list
        if (user) {
          await removeSavedBook(book.id, user.id);
        }
        const updatedSavedBooks = savedBooks.filter((savedBook) => savedBook.id !== book.id);
        setSavedBooks(updatedSavedBooks);
        
        // Update localStorage if no user
        if (!user) {
          localStorage.setItem("savedBooks", JSON.stringify(updatedSavedBooks));
        }
        
        toast({
          title: "Book removed",
          description: `"${book.title}" has been removed from your saved books.`,
        });
      } else {
        // Add book to saved list
        if (user) {
          await saveBook(book.id, user.id);
        }
        const updatedSavedBooks = [...savedBooks, book];
        setSavedBooks(updatedSavedBooks);
        
        // Update localStorage if no user
        if (!user) {
          localStorage.setItem("savedBooks", JSON.stringify(updatedSavedBooks));
        }
        
        toast({
          title: "Book saved",
          description: `"${book.title}" has been added to your saved books.`,
        });
      }
    } catch (error) {
      console.error("Error saving/removing book:", error);
      toast({
        title: "Error",
        description: "Failed to save/remove book. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const isBookSaved = (bookId: string) => {
    return savedBooks.some((book) => book.id === bookId);
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Browse by Category</h1>
        
        <CategoryList 
          categories={mappedCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-muted-foreground">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No books found</h3>
            <p className="text-muted-foreground mt-2">
              Try selecting a different category or checking back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => handleBookClick(book)}
                onSave={handleBookSave}
                onCategoryClick={(category) => handleCategorySelect(
                  mappedCategories.find(c => c.name.toLowerCase() === category.toLowerCase())?.id || null
                )}
                isSaved={isBookSaved(book.id)}
              />
            ))}
          </div>
        )}
        
        <BookDetailsModal
          book={selectedBook}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onSave={handleBookSave}
          onCategoryClick={(category) => {
            setIsDetailsOpen(false);
            handleCategorySelect(
              mappedCategories.find(c => c.name.toLowerCase() === category.toLowerCase())?.id || null
            );
          }}
          isSaved={selectedBook ? isBookSaved(selectedBook.id) : false}
        />
      </div>
    </MainLayout>
  );
}
