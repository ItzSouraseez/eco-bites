'use client';

export default function LoadingSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse"
        >
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

