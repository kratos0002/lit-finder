import React, { useState, useEffect } from 'react';
import { Search } from './components/Search';
import { TrendingSection } from './components/TrendingSection';

function App() {
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    // Log diagnostic information
    console.log('================ DIAGNOSTIC INFO ================');
    console.log('App component mounted');
    console.log('Environment check:');
    console.log('- window.ENV:', window.ENV);
    console.log('- import.meta.env.VITE_API_KEY exists:', !!import.meta.env.VITE_API_KEY);
    console.log('- import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('=================================================');
  }, []);

  const handleSearch = (query: string) => {
    console.log('Search query received in App:', query);
    setSearchTerm(query);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container px-4 sm:px-6 lg:px-8 flex h-16 items-center">
          <div className="mr-4">
            <h1 className="text-2xl font-serif font-bold">Alexandria</h1>
          </div>
          <div className="flex-1 flex justify-end">
            {/* Search input could go here */}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
      
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          <p>Alexandria Book Recommendations — Powered by the API from lit-finder</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
