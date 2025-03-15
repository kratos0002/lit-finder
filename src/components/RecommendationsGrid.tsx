
import React from "react";
import { Book } from "@/types";
import { BookCard } from "@/components/BookCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface RecommendationsGridProps {
  recommendations: Book[];
  onBookClick: (book: Book) => void;
  onSaveBook: (book: Book) => void;
  isBookSaved: (book: Book) => boolean;
}

export function RecommendationsGrid({
  recommendations,
  onBookClick,
  onSaveBook,
  isBookSaved,
}: RecommendationsGridProps) {
  // Extract unique categories from recommendations
  const categories = [...new Set(recommendations.map(book => book.category))];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">More Recommendations</h2>
        <Button variant="outline" size="sm" className="gap-1">
          See All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="all">All</TabsTrigger>
          {/* Generate tabs for unique categories */}
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {recommendations.map((book, index) => (
              <div 
                key={book.id} 
                className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <BookCard 
                  book={book} 
                  onClick={() => onBookClick(book)}
                  onSave={onSaveBook}
                  isSaved={isBookSaved(book)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Content for each category tab */}
        {categories.map(category => (
          <TabsContent key={category} value={category} className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {recommendations
                .filter(book => book.category === category)
                .map((book, index) => (
                  <div 
                    key={book.id} 
                    className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <BookCard 
                      book={book} 
                      onClick={() => onBookClick(book)}
                      onSave={onSaveBook}
                      isSaved={isBookSaved(book)}
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
