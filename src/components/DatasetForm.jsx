'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import CameraCapture from '@/components/CameraCapture';
import Toast from '@/components/Toast';
import ScoreInfo from '@/components/ScoreInfo';

export default function DatasetForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const [productImage, setProductImage] = useState(null);
  const [nutritionImage, setNutritionImage] = useState(null);
  const [productPreview, setProductPreview] = useState(null);
  const [nutritionPreview, setNutritionPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showProductCamera, setShowProductCamera] = useState(false);
  const [showNutritionCamera, setShowNutritionCamera] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
  
  // Form fields state
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    energy: '',
    fat: '',
    sugars: '',
    salt: '',
    protein: '',
    fiber: '',
    sodium: '',
    ingredients: '',
    allergens: '',
    nutriScore: 'A',
    ecoScore: 'B',
  });

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const handleImageFile = (file, type) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast(`Please select an image file for ${type === 'product' ? 'product image' : 'nutrition label'}`, 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${type === 'product' ? 'Product' : 'Nutrition'} image size should be less than 10MB`, 'error');
      return;
    }
    
    if (type === 'product') {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setNutritionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNutritionPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageSelect = (e) => {
    const file = e.target.files[0];
    handleImageFile(file, 'product');
  };

  const handleNutritionImageSelect = (e) => {
    const file = e.target.files[0];
    handleImageFile(file, 'nutrition');
  };

  const handleProductCameraCapture = (file) => {
    handleImageFile(file, 'product');
    setShowProductCamera(false);
  };

  const handleNutritionCameraCapture = (file) => {
    handleImageFile(file, 'nutrition');
    setShowNutritionCamera(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const extractDataFromImages = async () => {
    if (!productImage || !nutritionImage) {
      showToast('Please upload both product image and nutrition label image', 'error');
      return false;
    }

    showToast('Extracting data from images...', 'info');
    setLoading(true);

    try {
      // Step 1: Identify product name from product image
      const productFormData = new FormData();
      productFormData.append('image', productImage);

      const productResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: productFormData,
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to identify product');
      }

      const productResult = await productResponse.json();
      const productInfo = {
        name: productResult.data?.name || '',
        brand: productResult.data?.brand || '',
      };

      // Step 2: Extract nutrition data directly from nutrition label image
      const nutritionFormData = new FormData();
      nutritionFormData.append('image', nutritionImage);

      const nutritionResponse = await fetch('/api/extract-nutrition', {
        method: 'POST',
        body: nutritionFormData,
      });

      if (!nutritionResponse.ok) {
        const errorData = await nutritionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract nutrition data from label');
      }

      const nutritionResult = await nutritionResponse.json();
      const nutritionData = nutritionResult.data;
      const nutrition = nutritionData.nutrition || {};

      // Auto-populate form fields
      setFormData(prev => ({
        ...prev,
        productName: productInfo.name || prev.productName,
        brand: productInfo.brand || prev.brand,
        energy: nutrition.energy?.toString() || prev.energy,
        fat: nutrition.fat?.toString() || prev.fat,
        sugars: nutrition.sugars?.toString() || prev.sugars,
        salt: nutrition.salt?.toString() || prev.salt,
        protein: nutrition.protein?.toString() || prev.protein,
        fiber: nutrition.fiber?.toString() || prev.fiber,
        sodium: nutrition.sodium?.toString() || prev.sodium,
        ingredients: nutritionData.ingredients || prev.ingredients,
        allergens: Array.isArray(nutritionData.allergens) 
          ? nutritionData.allergens.join(', ') 
          : prev.allergens,
      }));

      showToast('Data extracted successfully! Please review and edit if needed.', 'success');
      return true;
    } catch (err) {
      console.error('Error extracting data:', err);
      showToast('AI extraction failed. Please fill in the fields manually.', 'warning');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }

    if (!user) {
      showToast('Please sign in to contribute products', 'error');
      return;
    }

    setLoading(true);

    try {
      // Parse numeric values
      const nutrition = {
        energy: parseFloat(formData.energy) || 0,
        fat: parseFloat(formData.fat) || 0,
        sugars: parseFloat(formData.sugars) || 0,
        salt: parseFloat(formData.salt) || 0,
        protein: parseFloat(formData.protein) || 0,
        fiber: parseFloat(formData.fiber) || 0,
        sodium: parseFloat(formData.sodium) || 0,
      };

      // Parse allergens
      const allergens = formData.allergens
        ? formData.allergens.split(',').map(a => a.trim()).filter(a => a)
        : [];

      // Calculate Nutri-Score
      let nutriScore = 'A';
      const totalScore = (nutrition.energy / 20) + (nutrition.fat / 3) + (nutrition.sugars / 1.5) + (nutrition.salt * 10);
      if (totalScore > 30) nutriScore = 'E';
      else if (totalScore > 25) nutriScore = 'D';
      else if (totalScore > 20) nutriScore = 'C';
      else if (totalScore > 15) nutriScore = 'B';

      // Prepare dataset entry
      const datasetEntry = {
        userId: user.uid,
        productName: formData.productName.trim(),
        brand: formData.brand.trim() || null,
        nutrition: nutrition,
        ingredients: formData.ingredients.trim() || 'Not available',
        allergens: allergens,
        nutriScore: formData.nutriScore || nutriScore,
        ecoScore: formData.ecoScore || 'B',
        packaging: [],
        description: `${formData.productName.trim()}${formData.brand.trim() ? ` by ${formData.brand.trim()}` : ''}`,
        productImageUrl: productPreview,
        nutritionImageUrl: nutritionPreview,
        servingSize: null,
        timestamp: serverTimestamp(),
        verified: false,
      };

      // Save to pendingProducts collection for admin approval
      await addDoc(collection(db, 'pendingProducts'), datasetEntry);

      showToast('Product submitted successfully! It will be reviewed by an admin before being added to the database.', 'success');
      
      // Reset form
      setProductImage(null);
      setNutritionImage(null);
      setProductPreview(null);
      setNutritionPreview(null);
      setFormData({
        productName: '',
        brand: '',
        energy: '',
        fat: '',
        sugars: '',
        salt: '',
        protein: '',
        fiber: '',
        sodium: '',
        ingredients: '',
        allergens: '',
        nutriScore: 'A',
        ecoScore: 'B',
      });

      if (onSuccess) {
        onSuccess(datasetEntry);
      }
    } catch (err) {
      console.error('Error adding to dataset:', err);
      showToast(err.message || 'Failed to contribute product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProductImage(null);
    setNutritionImage(null);
    setProductPreview(null);
    setNutritionPreview(null);
    setFormData({
      productName: '',
      brand: '',
      energy: '',
      fat: '',
      sugars: '',
      salt: '',
      protein: '',
      fiber: '',
      sodium: '',
      ingredients: '',
      allergens: '',
      nutriScore: 'A',
      ecoScore: 'B',
    });
  };

  if (!user) {
    return (
      <div className="bg-yellow-50/70 backdrop-blur-sm border border-yellow-200/50 rounded-2xl p-6">
        <p className="text-yellow-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Please sign in to add products to the dataset.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Contribute Product to Database
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload two images: one showing the product name, and another showing the nutrition facts label.
        </p>

        {/* Product Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image (showing product name)
          </label>
          <div className="border-2 border-dashed border-gray-300/50 bg-white/50 backdrop-blur-sm rounded-3xl p-6 text-center hover:border-yellow-500/80 hover:bg-white/70 transition-all duration-300">
            <input
              type="file"
              accept="image/*"
              onChange={handleProductImageSelect}
              className="hidden"
              id="product-image"
            />
            <label
              htmlFor="product-image"
              className="cursor-pointer block"
            >
              {productPreview ? (
                <div className="space-y-2">
                  <img
                    src={productPreview}
                    alt="Product preview"
                    className="max-h-48 mx-auto rounded-2xl object-contain shadow-xl border border-gray-200"
                  />
                  <p className="text-sm text-gray-600">
                    Click to change image
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Click to upload product image
                  </p>
                </div>
              )}
            </label>
          </div>
          {/* Camera Button for Product Image */}
          <button
            type="button"
            onClick={() => setShowProductCamera(true)}
            disabled={!!productPreview}
            className="mt-3 w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none disabled:opacity-60"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{productPreview ? 'Image Captured' : 'Capture with Camera'}</span>
          </button>
        </div>

        {/* Nutrition Label Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nutrition Facts Label Image
          </label>
          <div className="border-2 border-dashed border-gray-300/50 bg-white/50 backdrop-blur-sm rounded-3xl p-6 text-center hover:border-yellow-500/80 hover:bg-white/70 transition-all duration-300">
            <input
              type="file"
              accept="image/*"
              onChange={handleNutritionImageSelect}
              className="hidden"
              id="nutrition-image"
            />
            <label
              htmlFor="nutrition-image"
              className="cursor-pointer block"
            >
              {nutritionPreview ? (
                <div className="space-y-2">
                  <img
                    src={nutritionPreview}
                    alt="Nutrition label preview"
                    className="max-h-48 mx-auto rounded-2xl object-contain shadow-xl border border-gray-200"
                  />
                  <p className="text-sm text-gray-600">
                    Click to change image
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Click to upload nutrition label
                  </p>
                </div>
              )}
            </label>
          </div>
          {/* Camera Button for Nutrition Image */}
          <button
            type="button"
            onClick={() => setShowNutritionCamera(true)}
            disabled={!!nutritionPreview}
            className="mt-3 w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none disabled:opacity-60"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{nutritionPreview ? 'Image Captured' : 'Capture with Camera'}</span>
          </button>
        </div>

        {/* Extract Data Button */}
        {productPreview && nutritionPreview && (
          <div className="mb-6">
            <button
              type="button"
              onClick={extractDataFromImages}
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Extract Data from Images
                </>
              )}
            </button>
          </div>
        )}

        {/* Product Information Fields */}
        <div className="mb-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Product Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="Enter brand name"
              />
            </div>
          </div>
        </div>

        {/* Nutrition Values */}
        <div className="mb-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Nutrition Values (per 100g)</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy (kcal)
              </label>
              <input
                type="number"
                name="energy"
                value={formData.energy}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fat (g)
              </label>
              <input
                type="number"
                name="fat"
                value={formData.fat}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sugars (g)
              </label>
              <input
                type="number"
                name="sugars"
                value={formData.sugars}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salt (g)
              </label>
              <input
                type="number"
                name="salt"
                value={formData.salt}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                name="protein"
                value={formData.protein}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiber (g)
              </label>
              <input
                type="number"
                name="fiber"
                value={formData.fiber}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sodium (g)
              </label>
              <input
                type="number"
                name="sodium"
                value={formData.sodium}
                onChange={handleInputChange}
                step="0.1"
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients
            </label>
            <textarea
              name="ingredients"
              value={formData.ingredients}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter ingredients list"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergens (comma-separated)
            </label>
            <input
              type="text"
              name="allergens"
              value={formData.allergens}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              placeholder="e.g., Milk, Eggs, Nuts"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Nutri-Score
                <ScoreInfo type="nutri" />
              </label>
              <p className="text-xs text-gray-500 mb-2">
                A 5-color label (A-E) indicating nutritional quality. A = best, E = lowest.
              </p>
              <select
                name="nutriScore"
                value={formData.nutriScore}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              >
                <option value="A">A - Best</option>
                <option value="B">B - Good</option>
                <option value="C">C - Moderate</option>
                <option value="D">D - Poor</option>
                <option value="E">E - Worst</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Eco-Score
                <ScoreInfo type="eco" />
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Environmental impact score (A-E). A = lowest impact, E = highest impact.
              </p>
              <select
                name="ecoScore"
                value={formData.ecoScore}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              >
                <option value="A">A - Best</option>
                <option value="B">B - Good</option>
                <option value="C">C - Moderate</option>
                <option value="D">D - Poor</option>
                <option value="E">E - Worst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !formData.productName.trim()}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Contribute Product'
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-6 py-3.5 bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-white/50 text-gray-800 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            Reset
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3.5 bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-white/50 text-gray-800 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Camera Modals */}
      {showProductCamera && (
        <CameraCapture
          onCapture={handleProductCameraCapture}
          onClose={() => setShowProductCamera(false)}
        />
      )}

      {showNutritionCamera && (
        <CameraCapture
          onCapture={handleNutritionCameraCapture}
          onClose={() => setShowNutritionCamera(false)}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </form>
  );
}

