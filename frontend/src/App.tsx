import React from 'react';
import { Search } from './components/Search';
import { TrendingSection } from './components/TrendingSection';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Alexandria</h1>
          <p className="text-gray-600">Discover literary treasures with AI-powered recommendations</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Search for Books, Authors, or Topics</h2>
          <Search />
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Trending Discoveries</h2>
          <TrendingSection />
        </div>
      </main>
      
      <footer className="bg-white mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            Alexandria Book Recommendations — Powered by the API from {' '}
            <a href="https://github.com/kratos0002/lit-finder" className="text-blue-500 hover:underline">
              lit-finder
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App; 