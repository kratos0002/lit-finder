
import { Book } from "@/types";
import { useState } from "react";
import { BookOpen, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  onSave?: (book: Book) => void;
  onClick?: () => void;
  isSaved?: boolean;
}

export function BookCard({ book, onSave, onClick, isSaved = false }: BookCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hover, setHover] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) onSave(book);
  };

  return (
    <Card 
      className="book-card overflow-hidden h-full transition-all duration-300 border-border/50"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative h-48 overflow-hidden">
        <div 
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-transform duration-500",
            hover ? "scale-110" : "scale-100",
            imageLoaded ? "image-loaded" : "image-loading"
          )}
          style={{ backgroundImage: `url(${book.coverImage})` }}
        >
          <img 
            src={book.coverImage} 
            alt={book.title} 
            className="opacity-0 w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        <div className="absolute top-2 right-2">
          <Badge 
            className={cn(
              "bg-background/80 backdrop-blur-sm text-foreground font-medium",
              book.matchScore > 90 ? "border-primary" : ""
            )}
          >
            {book.matchScore}% Match
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background to-transparent">
          <Badge variant="outline" className="bg-background/40 backdrop-blur-sm">
            {book.category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm text-muted-foreground">From {book.source}</span>
        </div>
        
        <h3 className="font-semibold text-lg line-clamp-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        
        <p className="text-sm line-clamp-2 text-foreground/80 mb-3">
          {book.summary}
        </p>
        
        <div className="flex justify-between items-center mt-auto pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs px-2 py-1 h-auto"
            onClick={onClick}
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Details
          </Button>
          
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={handleSave}
          >
            {isSaved ? "Saved" : "Save to My Books"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
