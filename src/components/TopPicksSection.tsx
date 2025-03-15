
import React from "react";
import { BookCard } from "@/components/BookCard";
import { InsightCard } from "@/components/InsightCard";
import { Book, Review, SocialPost } from "@/types";

interface TopPicksSectionProps {
  topBook: Book;
  topReview: Review;
  topSocial: SocialPost;
  onBookClick: (book: Book) => void;
  onSaveBook: (book: Book) => void;
  isBookSaved: (book: Book) => boolean;
}

export function TopPicksSection({
  topBook,
  topReview,
  topSocial,
  onBookClick,
  onSaveBook,
  isBookSaved,
}: TopPicksSectionProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Top Picks for You</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Book Card */}
        <div className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl">
          <BookCard 
            book={topBook}
            onClick={() => onBookClick(topBook)}
            onSave={onSaveBook}
            isSaved={isBookSaved(topBook)}
          />
        </div>
        
        {/* Top Review Card */}
        <div className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl" style={{ animationDelay: '0.1s' }}>
          <InsightCard item={topReview} type="review" />
        </div>
        
        {/* Top Social Post Card */}
        <div className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl" style={{ animationDelay: '0.2s' }}>
          <InsightCard item={topSocial} type="social" />
        </div>
      </div>
    </section>
  );
}
