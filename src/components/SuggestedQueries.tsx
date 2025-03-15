
import React from "react";
import { Badge } from "@/components/ui/badge";

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
  ];

  const handleQueryClick = (query: string) => {
    console.log("Selected suggested query:", query);
    onQuerySelect(query);
  };

  return (
    <section className="py-16 flex flex-col items-center justify-center text-center">
      <div className="mb-10 text-muted-foreground space-y-3">
        <h2 className="text-2xl font-medium text-foreground/90 mb-3">Begin Your Literary Journey</h2>
        <p className="text-lg">Enter a literary work you enjoy to get started</p>
        <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
          For example: "science fiction like three body problem" or "mystery novels similar to Sherlock Holmes"
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {suggestedQueries.map((query, index) => (
          <Badge 
            key={index}
            className="px-4 py-2.5 text-sm hover:bg-primary/20 cursor-pointer hover-lift" 
            onClick={() => handleQueryClick(query)}
            variant="outline"
          >
            {query}
          </Badge>
        ))}
      </div>
    </section>
  );
}
