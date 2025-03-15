
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, CalendarDays, ExternalLink, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface TrendingItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
  category: string;
}

interface TrendingCardProps {
  item: TrendingItem;
  onSave?: (item: TrendingItem) => void;
  isSaved?: boolean;
}

export function TrendingCard({ item, onSave, isSaved = false }: TrendingCardProps) {
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSave) {
      onSave(item);
    } else {
      toast({
        title: "Feature not available",
        description: "Preserving scrolls will be available soon.",
      });
    }
  };

  return (
    <Card className="overflow-hidden h-full border-border/30 hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-sm relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground/80">
          <Scroll className="w-3.5 h-3.5 text-primary/80" />
          <span className="font-medium">{item.source}</span>
          <span className="text-muted-foreground/50">•</span>
          <div className="flex items-center text-muted-foreground/70">
            <CalendarDays className="w-3 h-3 mr-1 opacity-70" />
            {new Date(item.date).toLocaleDateString()}
          </div>
        </div>
        
        <h3 className="font-serif text-lg mb-3 line-clamp-2 text-foreground/90">{item.title}</h3>
        
        <p className="text-sm line-clamp-3 text-foreground/70 mb-5">
          {item.summary}
        </p>
        
        <div className="flex gap-2 mt-auto">
          <Button
            variant="outline"
            className={cn(
              "flex-1 gap-2 text-sm font-medium",
              "bg-primary/90 hover:bg-primary text-primary-foreground border-none"
            )}
            asChild
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              Read Scroll
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-90" />
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "transition-all",
              isSaved 
                ? "bg-primary/80 text-primary-foreground" 
                : "bg-card/80 text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
            onClick={handleSave}
            title={isSaved ? "Preserved" : "Preserve Scroll"}
          >
            <BookmarkPlus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
