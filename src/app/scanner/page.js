'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import CameraCapture from '@/components/CameraCapture';
import NutritionDisplay from '@/components/NutritionDisplay';
import ScoreBadge from '@/components/ScoreBadge';
import UserMenu from '@/components/UserMenu';
import ScoreInfo from '@/components/ScoreInfo';
import ProtectedRoute from '@/components/ProtectedRoute';
import { realtimeDb } from '@/lib/firebase';
import { ref, push, serverTimestamp, get, set, update, onValue } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';
import DietLogModal from '@/components/DietLogModal';

const db = realtimeDb;
const USER_COUNTRY = 'India';
const COUNTRY_COORDS = {
  india: { lat: 20.5937, lon: 78.9629 },
  malaysia: { lat: 4.2105, lon: 101.9758 },
  china: { lat: 35.8617, lon: 104.1954 },
  usa: { lat: 37.0902, lon: -95.7129 },
  unitedstates: { lat: 37.0902, lon: -95.7129 },
  'united states': { lat: 37.0902, lon: -95.7129 },
  uk: { lat: 55.3781, lon: -3.436 },
  'united kingdom': { lat: 55.3781, lon: -3.436 },
  germany: { lat: 51.1657, lon: 10.4515 },
  france: { lat: 46.2276, lon: 2.2137 },
  japan: { lat: 36.2048, lon: 138.2529 },
  australia: { lat: -25.2744, lon: 133.7751 },
  brazil: { lat: -14.235, lon: -51.9253 },
  canada: { lat: 56.1304, lon: -106.3468 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  indonesia: { lat: -0.7893, lon: 113.9213 },
  thailand: { lat: 15.87, lon: 100.9925 },
  spain: { lat: 40.4637, lon: -3.7492 },
};

const toKey = (country) => country?.toLowerCase().replace(/[^a-z]/g, '') || null;

const getCoords = (country) => {
  const key = toKey(country);
  return key ? COUNTRY_COORDS[key] || null : null;
};

const toTitleCase = (country) =>
  country
    ? country
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function ScannerContent() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDefaults, setLogDefaults] = useState(null);
  const [logStatus, setLogStatus] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [goals, setGoals] = useState(null);
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

  const logNutritionToHistory = async (data) => {
    if (!user || !db) return;

    try {
      await push(ref(db, 'scans'), {
        userId: user.uid,
        productName: data.name,
        brand: data.brand,
        nutrition: data.nutrition,
        nutriScore: data.nutriScore,
        ecoScore: data.ecoScore,
        imageUrl: imagePreview,
        timestamp: serverTimestamp(),
      });

      const userStatsRef = ref(db, `userStats/${user.uid}`);
      const snapshot = await get(userStatsRef);

      if (snapshot.exists()) {
        const currentData = snapshot.val();
        const newTotalScans = (currentData.totalScans || 0) + 1;
        const newPoints = (currentData.points || 0) + 1;
        const newLevel = Math.floor(newPoints / 100) + 1;

        await update(userStatsRef, {
          totalScans: newTotalScans,
          points: newPoints,
          level: newLevel,
          lastScanAt: serverTimestamp(),
        });
      } else {
        await set(userStatsRef, {
          userId: user.uid,
          totalContributions: 0,
          totalScans: 1,
          points: 1,
          level: 1,
          lastScanAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Error logging scan history:', err);
    }
  };

  const fetchNutritionFromImage = async () => {
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
    return result.data;
  };

  const fetchNutritionFromQuery = async () => {
    const response = await fetch('/api/nutrition-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: manualQuery }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch nutrition data');
    }

    const result = await response.json();
    return result.data;
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchNutritionFromImage();
      setNutritionData(data);
      await logNutritionToHistory(data);
    } catch (err) {
      console.error('Error analyzing image:', err);
      handleFriendlyError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) {
      setError('Please enter a food name to search');
      return;
    }

    setSearchLoading(true);
    setError(null);

    try {
      const data = await fetchNutritionFromQuery();
      setNutritionData(data);
      setImagePreview(null);
      setSelectedImage(null);
      if (user && db) {
        await logNutritionToHistory(data);
      }
    } catch (err) {
      console.error('Error fetching nutrition:', err);
      handleFriendlyError(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFriendlyError = (err) => {
    let errorMessage = 'Failed to analyze item. Please try again.';
    const message = err?.message || '';

    if (message.includes('API key')) {
      errorMessage = 'Gemini API key is not configured. Please check your environment variables.';
    } else if (message.includes('parse')) {
      errorMessage = 'Unable to read nutrition information. Try a clearer input.';
    } else if (message.includes('network') || message.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (message.length > 2) {
      errorMessage = message;
    }

    setError(errorMessage);
  };

  const handleTrackIntake = () => {
    if (!nutritionData) return;

    const nutrition = nutritionData.nutrition || {};
    setLogDefaults({
      productName: nutritionData.name || 'Unknown product',
      brand: nutritionData.brand || '',
      imageUrl: imagePreview,
      originCountry: nutritionData.originCountry || null,
      portionSize: '1 serving',
      calories: nutrition.energy || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      nutrition,
    });
    setShowLogModal(true);
  };

  const handleSaveIntake = async (logData) => {
    if (!user || !db) {
      setLogStatus({ type: 'error', message: 'Please sign in to track your diet.' });
      return;
    }

    try {
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0];
      const dietRef = ref(db, `dietLogs/${user.uid}/${dateKey}`);

      const entry = {
        ...logData,
        timestamp: serverTimestamp(),
      };

      const newLogRef = await push(dietRef, entry);

      if (logData.setReminder) {
        const remindAt = Date.now() + Number(logData.reminderMinutes || 60) * 60 * 1000;
        await push(ref(db, `reminders/${user.uid}`), {
          relatedEntry: newLogRef.key,
          message: `Time to review your next meal after ${logData.mealType}`,
          remindAt,
          createdAt: Date.now(),
          status: 'scheduled',
        });
      }

      setLogStatus({ type: 'success', message: 'Added to your daily intake!' });
      setShowLogModal(false);
    } catch (err) {
      console.error('Error saving diet log:', err);
      setLogStatus({ type: 'error', message: 'Failed to save intake. Please try again.' });
    }
  };

  useEffect(() => {
    if (!user || !db) return;

    const goalsRef = ref(db, `userGoals/${user.uid}`);
    const remindersRef = ref(db, `reminders/${user.uid}`);

    const goalsOff = onValue(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        setGoals(snapshot.val());
      } else {
        setGoals(null);
      }
    });

    const remindersOff = onValue(remindersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (a.remindAt || 0) - (b.remindAt || 0));
        setReminders(list);
      } else {
        setReminders([]);
      }
    });

    return () => {
      goalsOff();
      remindersOff();
    };
  }, [user, db]);

  const upcomingReminder = useMemo(() => {
    const now = Date.now();
    return reminders?.find((rem) => rem.remindAt && rem.remindAt > now);
  }, [reminders]);


  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNutritionData(null);
    setError(null);
  };

  const allergenList = (() => {
    if (!nutritionData || !nutritionData.allergens) return [];
    if (Array.isArray(nutritionData.allergens)) {
      return nutritionData.allergens.filter((item) => !!item && item.trim() !== '');
    }
    if (typeof nutritionData.allergens === 'string') {
      return nutritionData.allergens
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [];
  })();

  const originImpact = useMemo(() => {
    if (!nutritionData?.originCountry) return null;
    const originCoords = getCoords(nutritionData.originCountry);
    const userCoords = getCoords(USER_COUNTRY);
    if (!originCoords || !userCoords) return null;
    const distanceKm = haversineDistance(
      originCoords.lat,
      originCoords.lon,
      userCoords.lat,
      userCoords.lon
    );
    const co2SavedKg = Number(((distanceKm * 0.18) / 1000).toFixed(2));
    return {
      originCountry: toTitleCase(nutritionData.originCountry),
      distanceKm: Math.round(distanceKm),
      co2SavedKg,
    };
  }, [nutritionData]);

  return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <Link
                href="/dataset"
                className="inline-flex items-center gap-2 px-4 py-2 text-yellow-600 hover:text-yellow-700 font-semibold rounded-2xl hover:bg-yellow-50/50 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Contribute
              </Link>
              <UserMenu />
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-black">
                EcoBites
              </h1>
              <p className="text-lg text-gray-600">
                Dig deep into nutritional facts.
              </p>
            </div>
          </header>

        {/* Image Upload Section */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
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
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
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
                className="px-6 py-3.5 bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-white/50 text-gray-800 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Manual Search */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Search food by name</h2>
          <p className="text-sm text-gray-600 mb-4">
            Traveling or can’t scan the package? Type the food name and we’ll analyze it for you.
          </p>
          <form onSubmit={handleManualSearch} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 bg-white focus:ring-2 focus:ring-yellow-500"
              placeholder="e.g., grilled chicken sandwich"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-300 disabled:cursor-not-allowed transition"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/70 backdrop-blur-sm border border-red-200/50 rounded-2xl p-4 mb-6">
            <p className="text-red-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Results Display */}
        {nutritionData && (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-6 space-y-6">
            {originImpact && (
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex gap-3 shadow-inner">
                <div className="text-emerald-600 pt-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-emerald-900 space-y-1">
                  <p className="font-semibold">
                    This product originated from {originImpact.originCountry || 'its source'} and traveled approximately {originImpact.distanceKm.toLocaleString()} km to reach you in {USER_COUNTRY}.
                  </p>
                  <p>
                    Choosing a local alternative could cut roughly {originImpact.co2SavedKg} kg CO₂ from transport emissions.
                  </p>
                </div>
              </div>
            )}
            {allergenList.length > 0 && (
              <div className="bg-red-50/80 border border-red-200/60 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                <div className="flex items-center gap-3 text-red-800">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 18H3a2 2 0 01-2-2V8a2 2 0 012-2h2.07M19 18h2a2 2 0 002-2V8a2 2 0 00-2-2h-2M9 22h6m-3-4v4" />
                  </svg>
                  <div>
                    <p className="text-sm uppercase tracking-widest font-semibold">Allergen Warning</p>
                    <p className="text-sm">
                      This product contains the following allergens. Please review before consuming.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergenList.map((allergen, index) => (
                    <span
                      key={`${allergen}-${index}`}
                      className="px-3 py-1 bg-red-100/80 text-red-800 rounded-full text-sm font-medium"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {nutritionData.name || 'Unknown Product'}
                </h2>
                {nutritionData.brand && (
                  <p className="text-lg text-gray-600">
                    {nutritionData.brand}
                  </p>
                )}
              </div>
                    <div className="flex gap-2 items-center">
                      {nutritionData.nutriScore && (
                        <div className="flex items-center gap-2">
                          <ScoreBadge score={nutritionData.nutriScore} label="Nutri" size="lg" />
                          <ScoreInfo type="nutri" />
                        </div>
                      )}
                      {nutritionData.ecoScore && (
                        <div className="flex items-center gap-2">
                          <ScoreBadge score={nutritionData.ecoScore} label="Eco" size="lg" />
                          <ScoreInfo type="eco" />
                        </div>
                      )}
                    </div>
            </div>

            {nutritionData.description && (
              <p className="text-gray-700">
                {nutritionData.description}
              </p>
            )}

            {/* Nutrition Display */}
            {nutritionData.nutrition && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Nutrition Profile (per 100g)
                </h3>
                <NutritionDisplay nutrition={nutritionData.nutrition} />
              </div>
            )}

            {/* Ingredients */}
            {nutritionData.ingredients && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ingredients
                </h3>
                <p className="text-gray-700">
                  {nutritionData.ingredients}
                </p>
              </div>
            )}

            {/* Consumption CTA */}
            <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm uppercase text-gray-500 font-semibold">
                    Going to have this?
                  </p>
                  <h4 className="text-xl font-semibold text-gray-900">
                    Add it to your daily intake or set a reminder.
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleTrackIntake}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition"
                  >
                    Track Intake
                  </button>
                  <Link
                    href="/diet"
                    className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 transition"
                  >
                    View Goals
                  </Link>
                </div>
              </div>
              {upcomingReminder && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Next reminder scheduled for{' '}
                  {new Date(upcomingReminder.remindAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>

            {logStatus && (
              <div
                className={`rounded-2xl p-4 ${
                  logStatus.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {logStatus.message}
              </div>
            )}

            {/* Allergens */}
            {allergenList.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Allergens
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allergenList.map((allergen, index) => (
                    <span
                      key={`${allergen}-${index}`}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Packaging
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nutritionData.packaging.map((pack, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
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

        <DietLogModal
          open={showLogModal}
          onClose={() => setShowLogModal(false)}
          onSave={handleSaveIntake}
          defaultData={logDefaults}
        />
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

