'use client';

import { useState } from 'react';

export default function ScoreInfo({ type = 'nutri' }) {
  const [isOpen, setIsOpen] = useState(false);

  const info = {
    nutri: {
      title: 'Nutri-Score',
      description: 'A 5-color nutrition label (A to E) that helps you quickly identify the nutritional quality of food products. A (green) = best nutritional quality, E (red) = lowest nutritional quality.',
      titleClass: 'text-yellow-600 dark:text-yellow-400',
    },
    eco: {
      title: 'Eco-Score',
      description: 'An environmental impact score (A to E) that indicates the product\'s environmental footprint. A (green) = lowest environmental impact, E (red) = highest environmental impact. Considers factors like packaging, transportation, and production methods.',
      titleClass: 'text-yellow-600 dark:text-yellow-400',
    },
  };

  const currentInfo = info[type];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs font-semibold"
        aria-label={`What is ${currentInfo.title}?`}
      >
        ?
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-4 z-50">
            <div className="flex items-start justify-between mb-2">
              <h4 className={`text-sm font-bold ${currentInfo.titleClass}`}>
                {currentInfo.title}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentInfo.description}
            </p>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95 dark:border-t-gray-800/95"></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

