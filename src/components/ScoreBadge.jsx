'use client';

export default function ScoreBadge({ score, label, size = 'md' }) {
  if (!score) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      }`}>
        {label}: N/A
      </div>
    );
  }

  const scoreUpper = score.toUpperCase();
  let bgColor, textColor, borderColor;

  if (scoreUpper === 'A' || scoreUpper === 'E') {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    borderColor = 'border-green-300';
  } else if (scoreUpper === 'B' || scoreUpper === 'D') {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-300';
  } else if (scoreUpper === 'C') {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-800';
    borderColor = 'border-orange-300';
  } else {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    borderColor = 'border-red-300';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}`}
    >
      <span className="font-semibold">{label}: {scoreUpper}</span>
    </div>
  );
}

