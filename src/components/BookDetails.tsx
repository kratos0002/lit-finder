
import { Book } from "@/data/books";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Bookmark, Clock, Award, BookOpen } from "lucide-react";
import { useState } from "react";

interface BookDetailsProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookDetails({ book, isOpen, onClose }: BookDetailsProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          <div className="relative w-full md:w-1/3 h-[300px] md:h-auto overflow-hidden bg-muted">
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
          </div>
          <div className="p-6 w-full md:w-2/3 animate-fade-in">
            <DialogHeader>
              <div className="flex items-start justify-between mb-2">
                <DialogTitle className="text-2xl md:text-3xl font-bold">{book.title}</DialogTitle>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{book.rating.toFixed(1)}</span>
                </div>
              </div>
              <DialogDescription className="text-lg text-foreground/80">{book.author}</DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {book.categories.map(category => (
                <Badge key={category} variant="outline" className="bg-background/50 backdrop-blur-sm">
                  {category}
                </Badge>
              ))}
            </div>
            
            <div className="mt-4 space-y-4">
              <p className="text-foreground/80 leading-relaxed">{book.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{book.pages} pages</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Published {book.year}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span>Top rated</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button className="group bg-foreground text-background hover:bg-foreground/90">
                <span className="mr-2">Read now</span>
                <BookOpen className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" className="gap-2">
                <Bookmark className="w-4 h-4" />
                <span>Save for later</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
