
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { BookCard } from "@/components/BookCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function MyBooksPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadSavedBooks = async () => {
      setIsLoading(true);
      
      if (!user) {
        // If no user is logged in, try to load from localStorage as fallback
        const storedBooks = localStorage.getItem('savedBooks');
        if (storedBooks) {
          setSavedBooks(JSON.parse(storedBooks));
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('saved_books')
          .select('book_id')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const bookIds = data.map(item => item.book_id);
          
          // Fetch the actual book details
          const { data: booksData, error: booksError } = await supabase
            .from('books')
            .select('*')
            .in('id', bookIds);
            
          if (booksError) throw booksError;
          
          if (booksData) {
            // Transform Supabase book format to app Book format
            const books: Book[] = booksData.map(book => ({
              id: book.id,
              title: book.title,
              author: book.author,
              coverImage: book.cover_image || '',
              description: book.description,
              summary: book.summary,
              category: book.category,
              matchScore: book.match_score,
              publicationDate: book.publication_date || '',
              source: book.source as any
            }));
            
            setSavedBooks(books);
          }
        } else {
          setSavedBooks([]);
        }
      } catch (error) {
        console.error("Error loading saved books:", error);
        toast({
          title: "Error loading books",
          description: "Could not load your saved books. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedBooks();
  }, [user, toast]);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleRemoveBook = async (book: Book) => {
    try {
      if (user) {
        // Remove from Supabase
        const { error } = await supabase
          .from('saved_books')
          .delete()
          .eq('book_id', book.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
      
      // Always update local state
      setSavedBooks(savedBooks.filter(savedBook => savedBook.id !== book.id));
      
      // Update localStorage if user is not authenticated
      if (!user) {
        localStorage.setItem('savedBooks', JSON.stringify(
          savedBooks.filter(savedBook => savedBook.id !== book.id)
        ));
      }
      
      toast({
        title: "Book removed",
        description: `"${book.title}" has been removed from your books.`,
      });
    } catch (error: any) {
      console.error("Error removing book:", error);
      toast({
        title: "Error removing book",
        description: error.message || "An error occurred while removing the book.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
          <h1 className="text-3xl font-bold mb-4">Sign in to view your books</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Create an account or sign in to save your favorite books and access them from any device.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Books</h1>
          <p className="text-muted-foreground">Your saved books and reading list.</p>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-lg p-4 h-[400px] animate-pulse">
                <div className="w-full h-48 bg-muted rounded mb-4"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="flex justify-between mt-4">
                  <div className="h-9 bg-muted rounded w-24"></div>
                  <div className="h-9 bg-muted rounded w-9"></div>
                </div>
              </div>
            ))}
          </div>
        ) : savedBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => handleBookClick(book)}
                onSave={() => handleRemoveBook(book)}
                isSaved={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved books yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start exploring recommendations and save books to your personal collection.
            </p>
          </div>
        )}
      </div>

      <BookDetailsModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleRemoveBook}
        isSaved={true}
      />
    </MainLayout>
  );
}
