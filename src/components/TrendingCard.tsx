
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, CalendarDays, ExternalLink } from "lucide-react";
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
        description: "Saving trending items will be available soon.",
      });
    }
  };

  return (
    <Card className="overflow-hidden h-full border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span>{item.source}</span>
          <span>•</span>
          <div className="flex items-center">
            <CalendarDays className="w-3 h-3 mr-1" />
            {new Date(item.date).toLocaleDateString()}
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
        
        <p className="text-sm line-clamp-3 text-foreground/80 mb-4">
          {item.summary}
        </p>
        
        <div className="flex gap-2 mt-auto">
          <Button
            variant="outline"
            className={cn(
              "flex-1 gap-2",
              "bg-[#ff9800] hover:bg-[#e68900] text-white border-none"
            )}
            asChild
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              Read More
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              isSaved 
                ? "bg-primary text-primary-foreground" 
                : "bg-transparent text-muted-foreground hover:bg-primary/10"
            )}
            onClick={handleSave}
            title={isSaved ? "Saved" : "Save to My Books"}
          >
            <BookmarkPlus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
