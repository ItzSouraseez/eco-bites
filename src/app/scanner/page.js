'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import CameraCapture from '@/components/CameraCapture';
import NutritionDisplay from '@/components/NutritionDisplay';
import ScoreBadge from '@/components/ScoreBadge';
import UserMenu from '@/components/UserMenu';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

function ScannerContent() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const { user } = useAuth();

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setError(null);
    setNutritionData(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageCapture = (file) => {
    handleImageSelect(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send image to API route for analysis
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();
      const data = result.data;
      setNutritionData(data);

      // Save to Firestore if user is logged in
      if (user && db) {
        try {
          await addDoc(collection(db, 'scans'), {
            userId: user.uid,
            productName: data.name,
            brand: data.brand,
            nutrition: data.nutrition,
            nutriScore: data.nutriScore,
            ecoScore: data.ecoScore,
            imageUrl: imagePreview,
            timestamp: serverTimestamp(),
          });
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Don't throw - analysis was successful
        }
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      let errorMessage = 'Failed to analyze image. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // More user-friendly error messages
      if (errorMessage.includes('API key')) {
        errorMessage = 'Gemini API key is not configured. Please check your environment variables.';
      } else if (errorMessage.includes('parse')) {
        errorMessage = 'Unable to read nutrition information from the image. Please try a clearer image with visible nutrition labels.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNutritionData(null);
    setError(null);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <Link
                href="/dataset"
                className="inline-flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-700 dark:text-green-400 font-semibold rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Contribute to our Database
              </Link>
              <UserMenu />
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                EcoBites
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Dig deep into nutritional facts.
              </p>
            </div>
          </header>

        {/* Image Upload Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload or Capture Food Product
          </h2>
          
          <ImageUpload
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onImageCapture={() => setShowCamera(true)}
          />

          {imagePreview && (
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Nutrition'
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 text-gray-800 dark:text-white rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-2xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Results Display */}
        {nutritionData && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {nutritionData.name || 'Unknown Product'}
                </h2>
                {nutritionData.brand && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {nutritionData.brand}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {nutritionData.nutriScore && (
                  <ScoreBadge score={nutritionData.nutriScore} label="Nutri" size="lg" />
                )}
                {nutritionData.ecoScore && (
                  <ScoreBadge score={nutritionData.ecoScore} label="Eco" size="lg" />
                )}
              </div>
            </div>

            {nutritionData.description && (
              <p className="text-gray-700 dark:text-gray-300">
                {nutritionData.description}
              </p>
            )}

            {/* Nutrition Display */}
            {nutritionData.nutrition && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Nutrition Profile (per 100g)
                </h3>
                <NutritionDisplay nutrition={nutritionData.nutrition} />
              </div>
            )}

            {/* Ingredients */}
            {nutritionData.ingredients && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ingredients
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {nutritionData.ingredients}
                </p>
              </div>
            )}

            {/* Allergens */}
            {nutritionData.allergens && nutritionData.allergens.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Allergens
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nutritionData.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Packaging */}
            {nutritionData.packaging && nutritionData.packaging.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Packaging
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nutritionData.packaging.map((pack, index) => (
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
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <CameraCapture
            onCapture={handleImageCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <ProtectedRoute>
      <ScannerContent />
    </ProtectedRoute>
  );
}

