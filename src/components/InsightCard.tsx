
import { Review, SocialPost } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  item: Review | SocialPost | null;
  type: "review" | "social";
}

export function InsightCard({ item, type }: InsightCardProps) {
  // Early return with a placeholder if item is null or undefined
  if (!item) {
    return (
      <Card className="overflow-hidden h-full border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span>No data available</span>
          </div>
          
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {type === "review" ? "No review available" : "No social post available"}
          </h3>
          
          <p className="text-sm line-clamp-3 text-foreground/80 mb-4">
            We couldn't find any {type === "review" ? "reviews" : "social posts"} for this book.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-full border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span>{item.source}</span>
          <span>•</span>
          <div className="flex items-center">
            <CalendarDays className="w-3 h-3 mr-1" />
            {item.date}
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
        
        <p className="text-sm line-clamp-3 text-foreground/80 mb-4">
          {item.summary}
        </p>
        
        <Button
          variant="outline"
          className={cn(
            "w-full gap-2 mt-auto",
            type === "review" ? "bg-[#ff9800] hover:bg-[#e68900] text-white border-none" : "bg-[#8e24aa] hover:bg-[#7b1fa2] text-white border-none"
          )}
          asChild
        >
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {type === "review" ? "Read Full Review" : "View on Social Media"}
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
