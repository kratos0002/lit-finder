
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (searchQuery === "") {
      onSearch("");
    }
  }, [searchQuery, onSearch]);

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto">
      <div className={`relative flex items-center transition-all duration-300 rounded-full ${isFocused ? 'ring-2 ring-foreground/20' : ''}`}>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by title, author, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-10 pr-10 py-6 rounded-full border border-border/50 bg-background/70 backdrop-blur-sm transition-all"
        />
        <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
        
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <Button 
          type="submit" 
          size="sm" 
          className="absolute right-1 rounded-full px-4 bg-foreground text-background hover:bg-foreground/90"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
