'use client';

import { useState, useEffect } from 'react';

export default function DietLogModal({ open, onClose, onSave, defaultData }) {
  const [formData, setFormData] = useState({
    mealType: 'Lunch',
    portionSize: '1 serving',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
    setReminder: false,
    reminderMinutes: 120,
  });

  useEffect(() => {
    if (defaultData) {
      setFormData((prev) => ({
        ...prev,
        mealType: prev.mealType,
        portionSize: defaultData.portionSize || prev.portionSize,
        calories:
          defaultData.calories !== undefined
            ? Math.round(Number(defaultData.calories) || 0)
            : prev.calories,
        protein:
          defaultData.protein !== undefined
            ? Math.round(Number(defaultData.protein) || 0)
            : prev.protein,
        carbs:
          defaultData.carbs !== undefined
            ? Math.round(Number(defaultData.carbs) || 0)
            : prev.carbs,
        fat:
          defaultData.fat !== undefined
            ? Math.round(Number(defaultData.fat) || 0)
            : prev.fat,
        notes: defaultData.notes || '',
      }));
    }
  }, [defaultData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!defaultData?.productName) return;

    onSave({
      ...formData,
      productName: defaultData.productName,
      brand: defaultData.brand || null,
      imageUrl: defaultData.imageUrl || null,
      nutrition: defaultData.nutrition || {},
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Track intake</p>
            <h2 className="text-2xl font-semibold text-gray-900">
              {defaultData?.productName || 'Selected item'}
            </h2>
            {defaultData?.brand && (
              <p className="text-sm text-gray-600">{defaultData.brand}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Type
              </label>
              <select
                name="mealType"
                value={formData.mealType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-yellow-500"
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
                  <option key={meal} value={meal}>
                    {meal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portion Size
              </label>
              <input
                type="text"
                name="portionSize"
                value={formData.portionSize}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., 1 bar, 150g"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            {[
              { label: 'Calories', name: 'calories', unit: 'kcal' },
              { label: 'Protein', name: 'protein', unit: 'g' },
              { label: 'Carbs', name: 'carbs', unit: 'g' },
              { label: 'Fat', name: 'fat', unit: 'g' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  {field.label}
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-yellow-500">
                  <input
                    type="number"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full bg-transparent outline-none"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500">{field.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-yellow-500"
              placeholder="Add any extra notes..."
            />
          </div>

          <div className="bg-yellow-50/70 border border-yellow-200 rounded-2xl p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="setReminder"
                checked={formData.setReminder}
                onChange={handleChange}
                className="w-5 h-5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
              />
              <div>
                <p className="font-medium text-gray-900">Set a reminder</p>
                <p className="text-sm text-gray-600">
                  We'll remind you to check your next meal or water intake.
                </p>
              </div>
            </label>

            {formData.setReminder && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder in (minutes)
                </label>
                <input
                  type="number"
                  name="reminderMinutes"
                  min="10"
                  step="5"
                  value={formData.reminderMinutes}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-white focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition"
            >
              Save to Daily Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

