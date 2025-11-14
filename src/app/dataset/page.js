'use client';

import { useState } from 'react';
import DatasetForm from '@/components/DatasetForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu';

function DatasetContent() {
  const [showForm, setShowForm] = useState(true);

  const handleSuccess = (entry) => {
    console.log('Product added to dataset:', entry);
    // Optionally refresh or show a list of added products
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/scanner"
              className="inline-flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-700 dark:text-green-400 font-semibold rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Scanner
            </Link>
            <UserMenu />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              Contribute to our Database
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Help build a community-driven nutrition database for everyone
            </p>
          </div>
        </header>

        {/* Instructions */}
        <div className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How to add a product:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-300 text-sm">
            <li>Upload an image showing the product name and brand</li>
            <li>Upload an image of the nutrition facts label</li>
            <li>Click "Contribute Product" - our AI will extract the information</li>
            <li>The product will be saved to our shared database for all users</li>
          </ol>
        </div>

        {/* Dataset Form */}
        {showForm && (
          <DatasetForm
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!showForm && (
          <div className="text-center py-8">
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Add Another Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DatasetPage() {
  return (
    <ProtectedRoute>
      <DatasetContent />
    </ProtectedRoute>
  );
}

