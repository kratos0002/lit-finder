
import { Book } from "@/data/books";
import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  layout?: "grid" | "featured";
}

export function BookCard({ book, onClick, layout = "grid" }: BookCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (layout === "featured") {
    return (
      <Card 
        className="book-card relative overflow-hidden h-[500px] cursor-pointer border-0 group shadow-subtle" 
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'image-loaded' : 'image-loading'}`}
          style={{ backgroundImage: `url(${book.coverImage})` }}
        >
          <img 
            src={book.coverImage} 
            alt={book.title} 
            className="opacity-0 w-full h-full object-cover"
            onLoad={handleImageLoad}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
          <div className="flex flex-col gap-2 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              {book.categories.slice(0, 2).map(category => (
                <Badge key={category} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white">
                  {category}
                </Badge>
              ))}
            </div>
            <h3 className="text-2xl font-bold">{book.title}</h3>
            <p className="text-lg text-white/90">{book.author}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{book.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="book-card h-full border overflow-hidden shadow-subtle">
      <div className="relative h-[220px] overflow-hidden">
        <div 
          className={`h-full w-full bg-cover bg-center ${imageLoaded ? 'image-loaded' : 'image-loading'}`}
          style={{ backgroundImage: `url(${book.coverImage})` }}
        >
          <img 
            src={book.coverImage} 
            alt={book.title} 
            className="opacity-0 w-full h-full object-cover"
            onLoad={handleImageLoad}
          />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm">{book.rating.toFixed(1)}</span>
        </div>
        <h3 className="font-bold text-lg line-clamp-1">{book.title}</h3>
        <p className="text-muted-foreground text-sm">{book.author}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {book.categories.slice(0, 2).map(category => (
            <Badge key={category} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
