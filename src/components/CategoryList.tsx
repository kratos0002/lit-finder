
import { Category } from "@/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CategoryTag } from "./CategoryTag";

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryList({ categories, selectedCategory, onSelectCategory }: CategoryListProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string | null) => {
    onSelectCategory(categoryId);
  };

  return (
    <div className="w-full pb-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 p-1">
          <CategoryTag
            category="All Books"
            size="md"
            variant={selectedCategory === null ? "default" : "outline"}
            showIcon={false}
            onClick={() => handleCategoryClick(null)}
            className={cn(
              selectedCategory === null ? "bg-foreground text-background" : "bg-secondary text-foreground/80"
            )}
          />

          {categories.map((category) => (
            <CategoryTag
              key={category.id}
              category={category.name}
              description={category.description}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={cn(
                selectedCategory === category.id ? "bg-foreground text-background" : "bg-secondary text-foreground/80"
              )}
            />
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
