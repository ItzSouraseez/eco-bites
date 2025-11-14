'use client';

export default function ScoreBadge({ score, label, size = 'md' }) {
  if (!score) {
    return (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      }`}>
        {label}: N/A
      </div>
    );
  }

  const scoreUpper = score.toUpperCase();
  let bgColor, textColor, borderColor, darkBgColor, darkTextColor, darkBorderColor;

  if (scoreUpper === 'A' || scoreUpper === 'E') {
    bgColor = 'bg-yellow-100/80';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-300/50';
    darkBgColor = 'dark:bg-yellow-900/40';
    darkTextColor = 'dark:text-yellow-200';
    darkBorderColor = 'dark:border-yellow-700/50';
  } else if (scoreUpper === 'B' || scoreUpper === 'D') {
    bgColor = 'bg-yellow-100/80';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-300/50';
    darkBgColor = 'dark:bg-yellow-900/40';
    darkTextColor = 'dark:text-yellow-200';
    darkBorderColor = 'dark:border-yellow-700/50';
  } else if (scoreUpper === 'C') {
    bgColor = 'bg-orange-100/80';
    textColor = 'text-orange-800';
    borderColor = 'border-orange-300/50';
    darkBgColor = 'dark:bg-orange-900/40';
    darkTextColor = 'dark:text-orange-200';
    darkBorderColor = 'dark:border-orange-700/50';
  } else {
    bgColor = 'bg-red-100/80';
    textColor = 'text-red-800';
    borderColor = 'border-red-300/50';
    darkBgColor = 'dark:bg-red-900/40';
    darkTextColor = 'dark:text-red-200';
    darkBorderColor = 'dark:border-red-700/50';
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-5 py-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-2xl border backdrop-blur-sm shadow-md ${bgColor} ${darkBgColor} ${textColor} ${darkTextColor} ${borderColor} ${darkBorderColor} ${sizeClasses[size]}`}
    >
      <span className="font-semibold">{label}: {scoreUpper}</span>
    </div>
  );
}

