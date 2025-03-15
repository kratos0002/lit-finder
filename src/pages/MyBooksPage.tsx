
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { BookCard } from "@/components/BookCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

export default function MyBooksPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const { toast } = useToast();
  
  // In a real app, we would fetch the saved books from a backend
  // For now, we'll use localStorage to simulate persistence
  useEffect(() => {
    const storedBooks = localStorage.getItem('savedBooks');
    if (storedBooks) {
      setSavedBooks(JSON.parse(storedBooks));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('savedBooks', JSON.stringify(savedBooks));
  }, [savedBooks]);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleRemoveBook = (book: Book) => {
    setSavedBooks(savedBooks.filter(savedBook => savedBook.id !== book.id));
    toast({
      title: "Book removed",
      description: `"${book.title}" has been removed from your books.`,
    });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Books</h1>
          <p className="text-muted-foreground">Your saved books and reading list.</p>
        </section>

        {savedBooks.length > 0 ? (
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
