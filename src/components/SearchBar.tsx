
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
  initialQuery?: string;
  placeholder?: string;
}

export function SearchBar({ 
  onSearch, 
  isSearching = false, 
  initialQuery = "",
  placeholder = "Search for books, authors, or topics..." 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the search input on component mount
    if (inputRef.current && !initialQuery) {
      inputRef.current.focus();
    }
  }, [initialQuery]);

  // Update local state when initialQuery changes
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        description: "Type a book title, author, or topic to search",
      });
      return;
    }
    
    console.log("Searching for:", searchQuery.trim());
    onSearch(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto">
      <div className={`relative flex items-center transition-all duration-300 rounded-full ${isFocused ? 'ring-2 ring-foreground/20' : ''}`}>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-10 pr-10 py-6 rounded-full border border-border/50 bg-background/70 backdrop-blur-sm transition-all"
          disabled={isSearching}
        />
        <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
        
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
            disabled={isSearching}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <Button 
          type="submit" 
          size="sm" 
          disabled={isSearching || !searchQuery.trim()}
          className="absolute right-1 rounded-full px-4 bg-[#ff9800] hover:bg-[#e68900] text-white"
        >
          {isSearching ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span className="hidden sm:inline">Searching</span>
            </span>
          ) : "Search"}
        </Button>
      </div>
    </form>
  );
}
