'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function NutritionChart({ nutrition, type = 'radar' }) {
  if (!nutrition) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No nutrition data available
      </div>
    );
  }

  // Prepare data for radar chart
  const radarData = [
    { name: 'Energy', value: Math.min(nutrition.energy / 500, 100) },
    { name: 'Fat', value: Math.min(nutrition.fat / 100, 100) },
    { name: 'Sugars', value: Math.min(nutrition.sugars / 100, 100) },
    { name: 'Salt', value: Math.min(nutrition.salt / 10, 100) },
    { name: 'Protein', value: Math.min(nutrition.protein / 100, 100) },
  ];

  // Prepare data for bar chart
  const barData = [
    { name: 'Energy (kcal)', value: nutrition.energy || 0 },
    { name: 'Fat (g)', value: nutrition.fat || 0 },
    { name: 'Sugars (g)', value: nutrition.sugars || 0 },
    { name: 'Salt (g)', value: nutrition.salt || 0 },
    { name: 'Protein (g)', value: nutrition.protein || 0 },
  ];

  if (type === 'radar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Nutrition"
            dataKey="value"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={barData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}

