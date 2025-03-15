
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecommendationInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export function RecommendationInput({ 
  onSubmit, 
  isLoading = false, 
  initialQuery = "" 
}: RecommendationInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const historyJson = localStorage.getItem('searchHistory');
    if (historyJson) {
      setSearchHistory(JSON.parse(historyJson));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    onSubmit(query.trim());
  };

  const handleHistoryItemClick = (term: string) => {
    setQuery(term);
    onSubmit(term);
  };

  return (
    <div className="space-y-4">
      <div className="text-left mb-2">
        <h2 className="text-xl font-medium mb-1">What kind of literary work would you like to read?</h2>
        <p className="text-muted-foreground text-sm">
          Describe a book, author, or genre you enjoy, and we'll find perfect matches.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., science fiction like Three Body Problem"
          className="w-full px-4 py-6 rounded-lg border border-border/50 bg-background/70 text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <Button 
          type="submit" 
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff9800] hover:bg-[#e68900] text-white rounded-md px-4"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finding...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Search className="w-4 h-4" />
              <span>Get Recommendations</span>
            </span>
          )}
        </Button>
      </form>
      
      {searchHistory.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-muted-foreground mr-1 my-1">Recent searches:</span>
          {searchHistory.map((term, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleHistoryItemClick(term)}
            >
              {term}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
