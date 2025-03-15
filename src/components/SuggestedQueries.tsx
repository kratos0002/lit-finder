
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface SuggestedQueriesProps {
  onQuerySelect: (query: string) => void;
}

export function SuggestedQueries({ onQuerySelect }: SuggestedQueriesProps) {
  const suggestedQueries = [
    "dystopian fiction like 1984",
    "philosophical novels",
    "magical realism like Gabriel García Márquez",
    "classic Russian literature",
    "science fiction with AI themes",
    "poetry collections",
    "historical fiction set in ancient Egypt",
    "contemporary Japanese literature",
    "novels about climate change",
    "award-winning books from the last decade",
    "Afrofuturism novels",
    "memoirs by female journalists",
  ];

  const handleQueryClick = (query: string) => {
    console.log("Selected suggested query:", query);
    onQuerySelect(query);
  };

  return (
    <section className="py-16 flex flex-col items-center justify-center text-center">
      <div className="mb-10 text-muted-foreground space-y-3">
        <h2 className="text-2xl font-medium text-foreground/90 mb-3 font-serif">Begin Your Journey Through Alexandria's Archives</h2>
        <p className="text-lg">What literary treasure would you seek in Alexandria?</p>
        <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
          For example: "science fiction like three body problem" or "mystery novels similar to Sherlock Holmes"
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {suggestedQueries.map((query, index) => (
          <Badge 
            key={index}
            className="px-4 py-2.5 text-sm hover:bg-primary/20 cursor-pointer hover-lift bg-card/40 backdrop-blur-sm border border-primary/10 flex items-center gap-2" 
            onClick={() => handleQueryClick(query)}
            variant="outline"
          >
            {index < 6 && <Sparkles className="h-3 w-3 text-amber-500" />}
            {query}
          </Badge>
        ))}
      </div>
    </section>
  );
}
