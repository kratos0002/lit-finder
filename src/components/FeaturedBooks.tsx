
import { Book } from "@/types";
import { BookCard } from "./BookCard";
import { useEffect, useState } from "react";

interface FeaturedBooksProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export function FeaturedBooks({ books, onSelectBook }: FeaturedBooksProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredBooks = books.slice(0, 3);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredBooks.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [featuredBooks.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-[500px]">
      <div 
        className="flex transition-transform duration-1000 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {featuredBooks.map((book) => (
          <div key={book.id} className="min-w-full h-full">
            <BookCard 
              book={book} 
              onClick={() => onSelectBook(book)}
            />
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {featuredBooks.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? "bg-white w-6" 
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
