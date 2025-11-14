'use client';

import { useState, useCallback, useRef } from 'react';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { user, supabase } = useAuth();
  
  // Track the last searched query and ongoing requests to prevent duplicates
  const lastQueryRef = useRef(null);
  const ongoingRequestRef = useRef(null);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setProducts([]);
      setHasSearched(false);
      lastQueryRef.current = null;
      return;
    }

    // Normalize query for comparison
    const normalizedQuery = query.trim().toLowerCase();
    
    // Prevent duplicate searches for the exact same query
    if (lastQueryRef.current === normalizedQuery) {
      return;
    }

    // Cancel any ongoing request
    if (ongoingRequestRef.current) {
      // Note: We can't cancel fetch, but we can prevent state updates
      ongoingRequestRef.current = null;
    }

    // Mark this query as being searched
    lastQueryRef.current = normalizedQuery;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    // Create abort controller for request cancellation
    const abortController = new AbortController();
    ongoingRequestRef.current = abortController;

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        signal: abortController.signal,
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      
      // Only update state if this is still the current request
      if (!abortController.signal.aborted) {
        setProducts(data.products || []);
      }

      // Save to history (non-blocking, don't await)
      if (!abortController.signal.aborted) {
        // Get auth token if user is logged in
        const getAuthHeaders = async () => {
          const headers = { 'Content-Type': 'application/json' };
          if (supabase && user) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }
            } catch (err) {
              console.error('Error getting session:', err);
            }
          }
          return headers;
        };

        getAuthHeaders().then((headers) => {
          fetch('/api/history', {
            method: 'POST',
            headers,
            body: JSON.stringify({ query }),
          }).catch((err) => {
            console.error('Failed to save history:', err);
          });
        });
      }
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }
      
      // Only update state if this is still the current request
      if (!abortController.signal.aborted) {
        setError(err.message);
        setProducts([]);
      }
    } finally {
      // Only update loading state if this is still the current request
      if (!abortController.signal.aborted) {
        setLoading(false);
        ongoingRequestRef.current = null;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <UserMenu />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              EcoBites
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track the sustainability and nutrition of your food products
            </p>
          </div>
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
