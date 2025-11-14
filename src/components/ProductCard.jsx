'use client';

import Image from 'next/image';
import Link from 'next/link';
import SustainabilityBadge from './SustainabilityBadge';

export default function ProductCard({ product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700">
          <Image
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {product.brand}
          </p>
          <div className="flex gap-2 flex-wrap">
            {product.nutriScore && (
              <SustainabilityBadge score={product.nutriScore} label="Nutri" size="sm" />
            )}
            {product.ecoScore && (
              <SustainabilityBadge score={product.ecoScore} label="Eco" size="sm" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

