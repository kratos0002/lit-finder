
import { Category } from "@/data/books";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="w-full pb-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 p-1">
          <button
            onClick={() => onSelectCategory(null)}
            onMouseEnter={() => setHoveredCategory(null)}
            onMouseLeave={() => setHoveredCategory(null)}
            className={cn(
              "category-pill inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              selectedCategory === null 
                ? "bg-foreground text-background" 
                : "bg-secondary text-foreground/80 hover:bg-secondary/80"
            )}
          >
            All Books
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={cn(
                "category-pill inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                selectedCategory === category.id 
                  ? "bg-foreground text-background" 
                  : "bg-secondary text-foreground/80 hover:bg-secondary/80"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
      
      {hoveredCategory !== null && (
        <div className="mt-2 text-sm text-muted-foreground animate-fade-in">
          {categories.find(c => c.id === hoveredCategory)?.description || "Browse all books in our collection"}
        </div>
      )}
    </div>
  );
}
