import React, { useState, useEffect } from 'react';
import { Search } from './components/Search';
import { TrendingSection } from './components/TrendingSection';
import { MainLayout } from './components/MainLayout';

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
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {!searchTerm ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif font-bold mb-3 bg-gradient-to-r from-[#d4af37] to-purple-400 bg-clip-text text-transparent">Discover Your Next Literary Journey</h1>
              <p className="text-gray-300">Our intelligent recommendation engine suggests books tailored to your interests.</p>
            </div>
            
            <div className="bg-[#2b2b2b] rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-serif mb-4">What literary treasure would you seek in Alexandria?</h2>
              <p className="text-gray-300 mb-4">Describe a book, author, or genre you enjoy, and we'll unveil perfect matches from our vast archives.</p>
              
              <div className="relative mt-6">
                <input
                  type="text"
                  placeholder="e.g., science fiction like Three Body Problem"
                  className="w-full bg-[#3a3a3a] text-white border-none rounded-full px-4 py-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button 
                  className="absolute right-2 top-2 bg-[#d4af37] hover:bg-[#c4a030] text-black px-4 py-1 rounded-full"
                  onClick={() => {
                    const input = document.querySelector('input');
                    if (input && input.value) {
                      handleSearch(input.value);
                    }
                  }}
                >
                  Unveil Treasures
                </button>
              </div>
              
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Previous searches:</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#3a3a3a] text-white rounded-full text-sm">the brothers karmazov</span>
                  <span className="px-3 py-1 bg-[#3a3a3a] text-white rounded-full text-sm">dystopian fiction like 1984</span>
                </div>
              </div>
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
