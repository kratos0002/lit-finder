
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookMarked, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export interface TrendingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  source: string;
  url: string;
  image_url?: string;
  published_at?: string;
  score?: number;
}

interface TrendingCardProps {
  item: TrendingItem;
  onSave?: (item: TrendingItem) => void;
  isSaved?: boolean;
}

export function TrendingCard({ item, onSave, isSaved = false }: TrendingCardProps) {
  const { toast } = useToast();
  
  const handleSave = () => {
    if (onSave) {
      onSave(item);
      toast({
        title: isSaved ? "Removed from saved items" : "Added to your collection",
        description: isSaved ? `"${item.title}" has been removed` : `"${item.title}" has been saved to your collection`,
        variant: isSaved ? "destructive" : "default"
      });
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-purple-500/20 bg-black/40 backdrop-blur-sm h-full transition-all hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-serif font-semibold line-clamp-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{item.title}</h3>
            <p className="text-sm text-purple-300">{item.source}</p>
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-300 line-clamp-3 flex-grow">{item.description}</p>
        
        <div className="mt-4 flex justify-between items-center pt-3 border-t border-purple-500/20">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
            {item.category}
          </Badge>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={`text-xs px-2 py-1 h-8 ${isSaved 
                ? 'text-purple-300 bg-purple-500/20' 
                : 'text-gray-300 hover:text-purple-300 hover:bg-purple-500/10'}`}
              onClick={handleSave}
            >
              <BookMarked className="w-4 h-4 mr-1" />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            
            <Button
              size="sm"
              variant="default"
              className="text-xs bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 px-2 py-1 h-8"
              asChild
            >
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Read
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
