'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      setProducts(data.products || []);

      // Save to history
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
      } catch (err) {
        console.error('Failed to save history:', err);
      }
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            EcoBites
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track the sustainability and nutrition of your food products
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Results */}
        <div className="mt-8">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <LoadingSkeleton count={6} />
            </div>
          )}

          {error && (
            <ErrorState
              message={error}
              onRetry={() => handleSearch(hasSearched ? 'retry' : '')}
            />
          )}

          {!loading && !error && hasSearched && products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No products found. Try a different search term.
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Search Results ({products.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}

          {!loading && !error && !hasSearched && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Start by searching for a food product above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
