'use client';

import { useRef } from 'react';

export default function ImageUpload({ imagePreview, onImageSelect, onImageCapture }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleImage = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    // Call callback
    if (onImageSelect) {
      onImageSelect(file);
    }
  };

  const handleCameraClick = (e) => {
    e.stopPropagation();
    if (onImageCapture) {
      onImageCapture();
    } else {
      // Fallback: trigger file input with camera
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImage(file);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 text-center hover:border-yellow-500/80 dark:hover:border-yellow-600/80 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {imagePreview ? (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-2xl object-contain shadow-xl border border-white/30 dark:border-gray-700/30"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Click to change image
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
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
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Upload food product image
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Click to browse or drag and drop
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Button - Disabled when image is previewed */}
      <button
        type="button"
        onClick={handleCameraClick}
        disabled={!!imagePreview}
        className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none disabled:opacity-60"
      >
        <svg
          className="w-6 h-6"
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
        <span className="text-lg">Capture with Camera</span>
      </button>
    </div>
  );
}

