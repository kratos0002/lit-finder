
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
    <section className="py-12 flex flex-col items-center justify-center text-center">
      <div className="mb-8 text-muted-foreground">
        <p className="text-xl mb-2">Enter a literary work you enjoy to get started</p>
        <p>For example: "science fiction like three body problem" or "mystery novels similar to Sherlock Holmes"</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {suggestedQueries.map((query, index) => (
          <Badge 
            key={index}
            className="px-4 py-2 text-sm hover:bg-primary/20 cursor-pointer" 
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
