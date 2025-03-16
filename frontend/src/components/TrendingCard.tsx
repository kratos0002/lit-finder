import React from 'react';

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
  const handleSave = () => {
    if (onSave) {
      onSave(item);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow transition-all hover:shadow-md">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold line-clamp-2">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.source}</p>
            <p className="mt-2 text-sm line-clamp-3">{item.description}</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {item.category}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              onClick={handleSave}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
            
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
            >
              Read
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 