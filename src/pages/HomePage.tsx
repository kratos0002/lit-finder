
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { BookCard } from "@/components/BookCard";
import { InsightCard } from "@/components/InsightCard";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { mockBooks, mockReviews, mockSocialPosts } from "@/data/mockData";
import { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const { toast } = useToast();

  const topRecommendation = mockBooks[0];
  const topReview = mockReviews[0];
  const topSocialPost = mockSocialPosts[0];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, we would fetch new recommendations here
    console.log("Searching for:", query);
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
    <MainLayout onSearch={handleSearch}>
      <div className="max-w-6xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent mb-2">
            Discover Your Next Literary Journey
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Personalized book recommendations based on what you love to read. Search for a book, author, or topic to get started.
          </p>
        </section>

        <Tabs defaultValue="recommendations" className="mb-10">
          <TabsList>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Latest Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations" className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onClick={() => handleBookClick(book)}
                  onSave={handleSaveBook}
                  isSaved={isBookSaved(book)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="py-4">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Top Book Recommendation</h2>
              <div className="max-w-md">
                <BookCard 
                  book={topRecommendation}
                  onClick={() => handleBookClick(topRecommendation)}
                  onSave={handleSaveBook}
                  isSaved={isBookSaved(topRecommendation)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Top Review</h2>
                <InsightCard item={topReview} type="review" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Top Social Media Post</h2>
                <InsightCard item={topSocialPost} type="social" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
