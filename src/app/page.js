'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import CameraCapture from '@/components/CameraCapture';
import NutritionDisplay from '@/components/NutritionDisplay';
import ScoreBadge from '@/components/ScoreBadge';
import UserMenu from '@/components/UserMenu';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
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
      setError(err.message || 'Failed to analyze image. Please try again.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              Scan food products with your camera to get instant nutrition information
            </p>
          </div>
        </header>

        {/* Image Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload or Capture Food Product
          </h2>
          
          <ImageUpload
            onImageSelect={handleImageSelect}
            onImageCapture={() => setShowCamera(true)}
          />

          {imagePreview && (
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze Nutrition'}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {nutritionData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
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
