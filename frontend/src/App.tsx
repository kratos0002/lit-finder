
import React, { useState } from 'react';
import { Search } from './components/Search';
import { TrendingSection } from './components/TrendingSection';
import { MainLayout } from '@/components/MainLayout';

function App() {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearch = (query: string) => {
    console.log('Search query received in App:', query);
    setSearchTerm(query);
  };

  return (
    <MainLayout onSearch={handleSearch}>
      <div className="max-w-6xl mx-auto">
        {!searchTerm ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif font-bold mb-3">Alexandria</h1>
              <p className="text-muted-foreground">Discover literary treasures with AI-powered recommendations</p>
            </div>
            
            <TrendingSection />
          </div>
        ) : (
          <div className="animate-fade-in">
            <Search />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;
