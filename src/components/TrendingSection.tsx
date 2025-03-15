import React, { useState } from "react";
import { TrendingCard, TrendingItem } from "./TrendingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Scroll, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrendingSectionProps {
  searchHistory?: string[];
}

export function TrendingSection({ searchHistory = [] }: TrendingSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<TrendingItem[]>([]);
  const { toast } = useToast();
  
  // Use React Query to fetch real trending items
  const { 
    data: trendingData, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['trending', searchHistory],
    queryFn: async () => {
      console.log('Fetching trending items with history:', searchHistory);
      
      const response = await supabase.functions.invoke('trending-content', {
        body: { searchHistory }
      });
      
      if (response.error) {
        console.error('Error from trending-content function:', response.error);
        throw new Error('Failed to get trending content');
      }
      
      return response.data as { items: TrendingItem[] };
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });

  const trendingItems = trendingData?.items || [];
  
  // Extract unique categories from trending items
  const categories = ['All', ...new Set(trendingItems.map(item => item.category) || [])];
  
  // Filter items by selected category
  const filteredItems = selectedCategory && selectedCategory !== 'All'
    ? trendingItems.filter(item => item.category === selectedCategory)
    : trendingItems;

  const handleRefresh = async () => {
    try {
      toast({
        title: "Updating scrolls",
        description: "Fetching the latest scrolls from around the literary world...",
      });
      
      await refetch();
      
      toast({
        title: "Scrolls updated",
        description: "The latest scrolls have been delivered to Alexandria."
      });
    } catch (err) {
      toast({
        title: "Failed to update scrolls",
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
            title: "Scroll preserved",
            description: `"${item.title}" has been preserved in your collection.`
          });
        } else {
          toast({
            title: "Already preserved",
            description: `"${item.title}" is already in your collection.`
          });
        }
      } else {
        toast({
          title: "Sign in required",
          description: "Please sign in to preserve scrolls in your collection.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error preserving scroll:", error);
      toast({
        title: "Error preserving scroll",
        description: "An error occurred while preserving the scroll.",
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
          <h2 className="text-2xl font-serif font-semibold">Current Scrolls</h2>
          <Scroll className="w-5 h-5 text-primary" />
        </div>
        
        <Button 
          variant="outline"
          size="sm" 
          className="gap-2 bg-[#8e24aa] hover:bg-[#7b1fa2] text-white border-none"
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
        >
          {isLoading || isRefetching ? (
            <>Updating<RefreshCw className="w-4 h-4 animate-spin" /></>
          ) : (
            <>Update Scrolls<RefreshCw className="w-4 h-4" /></>
          )}
        </Button>
      </div>
      
      {/* Category filters - only show if we have items */}
      {trendingItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <Badge 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer font-serif"
              onClick={() => setSelectedCategory(category === 'All' ? null : category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}
      
      {error ? (
        <div className="p-6 bg-card/40 backdrop-blur-sm border border-destructive/20 rounded-lg flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-serif mb-1">Failed to unfurl scrolls</h3>
          <p className="text-sm text-muted-foreground mb-4">Our librarians couldn't retrieve the latest scrolls.</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      ) : isLoading && !trendingItems.length ? (
        <div className="p-10 bg-card/40 backdrop-blur-sm border border-primary/20 rounded-lg flex flex-col items-center justify-center text-center">
          <RefreshCw className="h-10 w-10 text-primary/70 animate-spin mb-3" />
          <h3 className="text-lg font-serif mb-1">Unfurling scrolls</h3>
          <p className="text-sm text-muted-foreground">Our librarians are collecting the latest literary news...</p>
        </div>
      ) : trendingItems.length === 0 ? (
        <div className="p-8 bg-card/40 backdrop-blur-sm border border-primary/20 rounded-lg flex flex-col items-center justify-center text-center">
          <Scroll className="h-10 w-10 text-primary/70 mb-3" />
          <h3 className="text-lg font-serif mb-1">No scrolls available</h3>
          <p className="text-sm text-muted-foreground mb-4">Try updating or changing your search terms.</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
          >
            Update Scrolls
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems?.length > 0 && filteredItems.map((item, index) => (
            <div 
              key={item.id} 
              className="rounded-lg overflow-hidden shadow-lg animate-slide-up transition-all hover:shadow-xl"
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
