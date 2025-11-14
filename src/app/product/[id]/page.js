'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import SustainabilityBadge from '@/components/SustainabilityBadge';
import NutritionChart from '@/components/NutritionChart';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/product/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data.product);

        // Save to history
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: data.product.name,
              productId: data.product.id,
            }),
          });
        } catch (err) {
          console.error('Failed to save history:', err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <LoadingSkeleton count={1} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <ErrorState message={error} onRetry={() => router.refresh()} />
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-green-600 hover:text-green-700 dark:text-green-400"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 dark:text-green-400 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Search
        </Link>

        {/* Product Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Product Image */}
          <div className="relative w-full h-64 md:h-96 bg-gray-100 dark:bg-gray-700">
            <Image
              src={product.image || '/placeholder.svg'}
              alt={product.name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          {/* Product Info */}
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {product.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              {product.brand}
            </p>

            {/* Scores */}
            <div className="flex gap-4 mb-8 flex-wrap">
              {product.nutriScore && (
                <SustainabilityBadge score={product.nutriScore} label="Nutri-Score" size="lg" />
              )}
              {product.ecoScore && (
                <SustainabilityBadge score={product.ecoScore} label="Eco-Score" size="lg" />
              )}
            </div>

            {/* Nutrition Chart */}
            {product.nutrition && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Nutrition Profile
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <NutritionChart nutrition={product.nutrition} type="radar" />
                </div>
              </div>
            )}

            {/* Nutrition Details */}
            {product.nutrition && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Nutrition Facts (per 100g)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Energy</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.nutrition.energy || 0} kcal
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.nutrition.fat || 0}g
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sugars</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.nutrition.sugars || 0}g
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Salt</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.nutrition.salt || 0}g
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.nutrition.protein || 0}g
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additives */}
            {product.additives && product.additives.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Additives
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.additives.map((additive, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm"
                    >
                      {additive}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Packaging */}
            {product.packaging && product.packaging.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Packaging
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.packaging.map((pack, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {pack}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Carbon Footprint */}
            {product.carbonFootprint && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Carbon Footprint
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {product.carbonFootprint.toFixed(2)} kg CO₂
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    per 100g
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Ingredients
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

