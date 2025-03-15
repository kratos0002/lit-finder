
import React, { useState } from "react";
import { TrendingCard, TrendingItem } from "./TrendingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockTrendingItems } from "@/data/mockTrendingData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrendingSectionProps {
  searchHistory?: string[];
}

export function TrendingSection({ searchHistory = [] }: TrendingSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<TrendingItem[]>([]);
  const { toast } = useToast();
  
  // For now, we'll use mock data until the API is updated
  const { data: trendingItems, isLoading, error, refetch } = useQuery({
    queryKey: ['trending', searchHistory],
    queryFn: async () => {
      // This would typically call the API with search history and feedback
      // But for now, we'll use mock data and filter based on the history
      console.log('Fetching trending items with history:', searchHistory);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If we have search history, use it to "personalize" trending items
      if (searchHistory && searchHistory.length > 0) {
        // Simple matching - in the real API this would be more sophisticated
        return mockTrendingItems.sort((a, b) => {
          const aScore = searchHistory.some(term => 
            a.title.toLowerCase().includes(term.toLowerCase()) || 
            a.summary.toLowerCase().includes(term.toLowerCase())
          ) ? 1 : 0;
          
          const bScore = searchHistory.some(term => 
            b.title.toLowerCase().includes(term.toLowerCase()) || 
            b.summary.toLowerCase().includes(term.toLowerCase())
          ) ? 1 : 0;
          
          return bScore - aScore;
        });
      }
      
      return mockTrendingItems;
    },
    initialData: mockTrendingItems,
  });

  // Extract unique categories from trending items
  const categories = ['All', ...new Set(trendingItems?.map(item => item.category) || [])];
  
  // Filter items by selected category
  const filteredItems = selectedCategory && selectedCategory !== 'All'
    ? trendingItems?.filter(item => item.category === selectedCategory)
    : trendingItems;

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Trends refreshed",
        description: "The latest trending content has been loaded."
      });
    } catch (err) {
      toast({
        title: "Failed to refresh trends",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleSaveItem = async (item: TrendingItem) => {
    try {
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.user) {
        // In the real implementation, save to Supabase
        // For now, just update local state
        if (!savedItems.some(savedItem => savedItem.id === item.id)) {
          setSavedItems([...savedItems, item]);
          toast({
            title: "Item saved",
            description: `"${item.title}" has been saved to your collection.`
          });
        } else {
          toast({
            title: "Already saved",
            description: `"${item.title}" is already in your collection.`
          });
        }
      } else {
        toast({
          title: "Sign in required",
          description: "Please sign in to save items to your collection.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error saving item",
        description: "An error occurred while saving the item.",
        variant: "destructive"
      });
    }
  };

  const isItemSaved = (item: TrendingItem) => {
    return savedItems.some(savedItem => savedItem.id === item.id);
  };

  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Trending News and Social</h2>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        
        <Button 
          variant="outline"
          size="sm" 
          className="gap-2 bg-[#8e24aa] hover:bg-[#7b1fa2] text-white border-none"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <>Loading<RefreshCw className="w-4 h-4 animate-spin" /></>
          ) : (
            <>Refresh Trends<RefreshCw className="w-4 h-4" /></>
          )}
        </Button>
      </div>
      
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <Badge 
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(category === 'All' ? null : category)}
          >
            {category}
          </Badge>
        ))}
      </div>
      
      {error ? (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg mb-8">
          <p className="text-destructive">Failed to load trending content. Please try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems?.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-[#3a3a3a] rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl"
              style={{ animationDelay: `${0.1 * (index % 6)}s` }}
            >
              <TrendingCard 
                item={item} 
                onSave={handleSaveItem}
                isSaved={isItemSaved(item)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
