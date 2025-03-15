
import { Book } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Star, User } from "lucide-react";
import { useState } from "react";

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (book: Book) => void;
  isSaved?: boolean;
}

export function BookDetailsModal({ book, isOpen, onClose, onSave, isSaved = false }: BookDetailsModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!book) return null;

  const handleSave = () => {
    if (onSave) onSave(book);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
        <div className="flex flex-col md:flex-row h-full">
          <div className="relative w-full md:w-2/5 h-[300px] md:h-auto">
            <div 
              className={`absolute inset-0 bg-cover bg-center ${imageLoaded ? 'image-loaded' : 'image-loading'}`}
              style={{ backgroundImage: `url(${book.coverImage})` }}
            >
              <img 
                src={book.coverImage} 
                alt={book.title} 
                className="opacity-0 w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            <div className="absolute top-4 right-4">
              <Badge 
                className="bg-background/80 backdrop-blur-sm text-foreground font-medium"
              >
                {book.matchScore}% Match
              </Badge>
            </div>
          </div>
          
          <div className="p-6 w-full md:w-3/5">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {book.category}
                  </Badge>
                  <DialogTitle className="text-2xl font-bold mb-1">{book.title}</DialogTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <DialogDescription className="text-muted-foreground">
                      {book.author}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <DialogDescription className="text-muted-foreground">
                      {book.publicationDate}
                    </DialogDescription>
                    <span className="text-muted-foreground">•</span>
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-sm">From {book.source}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <h4 className="font-medium">Summary</h4>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {book.summary}
              </p>
              
              <h4 className="font-medium pt-2">Description</h4>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {book.description}
              </p>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSave}
                disabled={isSaved}
              >
                {isSaved ? "Saved to My Books" : "Save to My Books"}
              </Button>
              <Button variant="outline" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  More Info
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
