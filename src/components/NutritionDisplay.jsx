'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function NutritionDisplay({ nutrition }) {
  if (!nutrition) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No nutrition data available
      </div>
    );
  }

  // Prepare data for radar chart
  const normalizeValue = (value, max) => {
    if (!value || value === 0) return 0;
    return Math.min((value / max) * 100, 100);
  };

  const radarData = [
    { name: 'Energy', value: normalizeValue(nutrition.energy, 900) },
    { name: 'Fat', value: normalizeValue(nutrition.fat, 100) },
    { name: 'Sugars', value: normalizeValue(nutrition.sugars, 100) },
    { name: 'Salt', value: normalizeValue(nutrition.salt, 10) },
    { name: 'Protein', value: normalizeValue(nutrition.protein, 100) },
  ];

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 border border-white/30 dark:border-gray-700/50 shadow-lg">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Radar
              name="Nutrition"
              dataKey="value"
              stroke="#eab308"
              fill="#eab308"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value) => [`${value.toFixed(1)}%`, 'Nutrition']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Nutrition Facts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-600 dark:text-gray-400">Energy</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {nutrition.energy || 0} kcal
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {nutrition.fat || 0}g
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Sugars</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {nutrition.sugars || 0}g
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Salt</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {nutrition.salt || 0}g
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {nutrition.protein || 0}g
          </div>
        </div>
        {nutrition.fiber !== undefined && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Fiber</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {nutrition.fiber || 0}g
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

