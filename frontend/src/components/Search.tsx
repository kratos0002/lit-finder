
import React, { useState } from "react";
import { getRecommendations } from "@/services/recommendationService";
import { Book, RecommendationResponse } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search as SearchIcon, BookOpen, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SearchProps {
  onResultsReceived?: (results: RecommendationResponse) => void;
}

export function Search({ onResultsReceived }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [resultSource, setResultSource] = useState<"api" | "fallback" | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a book title, author, or subject to search for.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setResultSource(null);

    try {
      console.log(`Searching for: ${searchTerm}`);
      const response = await getRecommendations(searchTerm);
      console.log("Search results:", response);
      
      if (!response || (!response.recommendations || response.recommendations.length === 0)) {
        setError("No results found. Please try a different search term.");
        toast({
          title: "No results found",
          description: "We couldn't find any books matching your search. Try a different term.",
          variant: "destructive",
        });
        setResults(null);
      } else {
        setResults(response);
        
        // Determine if we're showing API or fallback results
        if (response.recommendations[0]?.source === 'fallback') {
          setResultSource('fallback');
        } else {
          setResultSource('api');
        }
        
        // Save search term to local storage
        const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
        const newHistory = [searchTerm, ...history.filter(item => item !== searchTerm)].slice(0, 5);
        localStorage.setItem("searchHistory", JSON.stringify(newHistory));
        
        // Call the callback if provided
        if (onResultsReceived) {
          onResultsReceived(response);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to get recommendations. Please try again later.");
      toast({
        title: "Search failed",
        description: "We couldn't process your search request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-8">
        <div className="relative flex items-center w-full">
          <Input
            type="text"
            placeholder="Search for books, authors, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-12 h-12 text-lg rounded-full pl-6"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1.5 h-9 w-9 rounded-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SearchIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-600" />
          <p className="text-lg">Searching the literary cosmos...</p>
          <p className="text-gray-500 mt-2">This might take up to 30 seconds as we consult multiple AI services</p>
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resultSource === 'fallback' && !isLoading && results && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800">
            <span className="font-semibold">Note:</span> Showing fallback results. The API service is currently unavailable or returned no results.
          </p>
        </div>
      )}

      {results && results.top_book && (
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Top Recommendation
          </h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold">{results.top_book.title}</h3>
              <p className="text-gray-600 mb-2">by {results.top_book.author}</p>
              <p className="mb-4">{results.top_book.summary}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {results.top_book.category || 'Fiction'}
                </span>
                {results.top_book.matchScore && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Match: {Math.round(results.top_book.matchScore * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {results && results.recommendations && results.recommendations.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-4">More Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.recommendations.map((book: Book) => (
              <div key={book.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-bold">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                <p className="text-sm mb-3 line-clamp-3">{book.summary}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                    {book.category || 'Fiction'}
                  </span>
                  {book.matchScore && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Match: {Math.round(book.matchScore * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !error && !isLoading && (
        <div className="text-center text-gray-500 py-6">
          <p>Enter a search term to discover book recommendations</p>
        </div>
      )}
    </div>
  );
}
