'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeDb } from '@/lib/firebase';
import {
  ref,
  onValue,
  set,
  push,
  remove,
  update,
  serverTimestamp,
} from 'firebase/database';
import Link from 'next/link';

const db = realtimeDb;

function DietDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState(null);
  const [logs, setLogs] = useState([]);
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [goalForm, setGoalForm] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({
    message: 'Check next meal',
    minutes: 120,
  });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user || !db) return;

    const goalsRef = ref(db, `userGoals/${user.uid}`);
    const today = new Date().toISOString().split('T')[0];
    const logsRef = ref(db, `dietLogs/${user.uid}/${today}`);
    const planRef = ref(db, `dietPlans/${user.uid}/latest`);
    const remindersRef = ref(db, `reminders/${user.uid}`);

    const offGoals = onValue(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        setGoals(snapshot.val());
        setGoalForm({
          calories: snapshot.val().calories || '',
          protein: snapshot.val().protein || '',
          carbs: snapshot.val().carbs || '',
          fat: snapshot.val().fat || '',
        });
      } else {
        setGoals(null);
      }
    });

    const offLogs = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setLogs(list);
      } else {
        setLogs([]);
      }
    });

    const offPlan = onValue(planRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlan(snapshot.val());
      } else {
        setPlan(null);
      }
    });

    const offReminders = onValue(remindersRef, (snapshot) => {
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
      offGoals();
      offLogs();
      offPlan();
      offReminders();
    };
  }, [user, db]);

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc.calories += Number(log.calories) || 0;
        acc.protein += Number(log.protein) || 0;
        acc.carbs += Number(log.carbs) || 0;
        acc.fat += Number(log.fat) || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [logs]);

  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setGoalForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveGoals = async (e) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      await set(ref(db, `userGoals/${user.uid}`), {
        calories: Number(goalForm.calories) || 0,
        protein: Number(goalForm.protein) || 0,
        carbs: Number(goalForm.carbs) || 0,
        fat: Number(goalForm.fat) || 0,
        updatedAt: Date.now(),
      });
      setStatus({ type: 'success', message: 'Goals updated' });
    } catch (err) {
      console.error('Error saving goals:', err);
      setStatus({ type: 'error', message: 'Failed to update goals' });
    }
  };

  const generatePlan = async () => {
    if (!goals) {
      setStatus({ type: 'error', message: 'Please set goals first' });
      return;
    }
    setPlanLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals,
          logs,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate plan');
      }

      const result = await response.json();
      await set(ref(db, `dietPlans/${user.uid}/latest`), {
        plan: result.plan,
        generatedAt: Date.now(),
      });

      setStatus({ type: 'success', message: 'Plan generated successfully' });
    } catch (err) {
      console.error('Plan generation error:', err);
      setStatus({ type: 'error', message: err.message });
    } finally {
      setPlanLoading(false);
    }
  };

  const addReminder = async () => {
    if (!user || !db) return;
    try {
      await push(ref(db, `reminders/${user.uid}`), {
        message: newReminder.message,
        remindAt: Date.now() + Number(newReminder.minutes || 60) * 60 * 1000,
        createdAt: Date.now(),
        status: 'scheduled',
      });
      setNewReminder((prev) => ({ ...prev, message: 'Check next meal', minutes: 120 }));
      setStatus({ type: 'success', message: 'Reminder scheduled' });
    } catch (err) {
      console.error('Reminder error:', err);
      setStatus({ type: 'error', message: 'Failed to schedule reminder' });
    }
  };

  const deleteReminder = async (id) => {
    if (!user || !db) return;
    try {
      await remove(ref(db, `reminders/${user.uid}/${id}`));
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-widest">Diet control</p>
            <h1 className="text-4xl font-bold text-gray-900">Daily Nutrition Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/scanner"
              className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Back to Scanner
            </Link>
            <button
              onClick={generatePlan}
              disabled={planLoading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-300 disabled:text-gray-500 transition"
            >
              {planLoading ? 'Generating...' : 'Generate Plan with Gemini'}
            </button>
          </div>
        </header>

        {status && (
          <div
            className={`rounded-2xl p-4 ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/80 border border-white/50 rounded-3xl shadow-xl p-6 space-y-4">
            <p className="text-sm uppercase text-gray-500 font-semibold">
              Daily goals
            </p>
            <form onSubmit={saveGoals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Calories (kcal)', name: 'calories' },
                  { label: 'Protein (g)', name: 'protein' },
                  { label: 'Carbs (g)', name: 'carbs' },
                  { label: 'Fat (g)', name: 'fat' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      name={field.name}
                      value={goalForm[field.name]}
                      onChange={handleGoalChange}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition"
              >
                Save Goals
              </button>
            </form>
          </div>

          <div className="bg-white/80 border border-white/50 rounded-3xl shadow-xl p-6 space-y-3">
            <p className="text-sm uppercase text-gray-500 font-semibold">
              Today&apos;s summary
            </p>
            {['calories', 'protein', 'carbs', 'fat'].map((key) => {
              const total = totals[key];
              const goal = goals?.[key] || 0;
              const percent = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0;
              const labels = {
                calories: 'Calories',
                protein: 'Protein',
                carbs: 'Carbs',
                fat: 'Fat',
              };
              const units = {
                calories: 'kcal',
                protein: 'g',
                carbs: 'g',
                fat: 'g',
              };

              return (
                <div key={key}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{labels[key]}</span>
                    <span>
                      {Math.round(total)} / {goal || '—'} {units[key]}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/80 border border-white/50 rounded-3xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm uppercase text-gray-500 font-semibold">Today</p>
                <h2 className="text-2xl font-bold text-gray-900">Daily intake log</h2>
              </div>
            </div>

            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No meals tracked yet. Log from the scanner page after analyzing a food item.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto pr-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/80 flex flex-col gap-1"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{log.productName}</p>
                        <p className="text-sm text-gray-500">
                          {log.mealType} • {log.portionSize}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {Math.round(log.calories || 0)} kcal
                        </p>
                        <p className="text-xs text-gray-500">
                          Protein {log.protein || 0}g • Carbs {log.carbs || 0}g • Fat {log.fat || 0}g
                        </p>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-gray-600 italic">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/80 border border-white/50 rounded-3xl shadow-xl p-6 space-y-4">
            <div>
              <p className="text-sm uppercase text-gray-500 font-semibold">Reminders</p>
              <h2 className="text-2xl font-bold text-gray-900">Diet alarms & hydration</h2>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={newReminder.message}
                onChange={(e) => setNewReminder((prev) => ({ ...prev, message: e.target.value }))}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-yellow-500"
                placeholder="Reminder message"
              />
              <input
                type="number"
                min="5"
                value={newReminder.minutes}
                onChange={(e) =>
                  setNewReminder((prev) => ({ ...prev, minutes: Number(e.target.value) }))
                }
                className="w-28 rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-yellow-500"
                placeholder="Minutes"
              />
              <button
                onClick={addReminder}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition"
              >
                Set
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-2">
              {reminders.length === 0 ? (
                <p className="text-gray-500 text-sm">No reminders scheduled yet.</p>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/80"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{reminder.message}</p>
                      {reminder.remindAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(reminder.remindAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Clear
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 border border-white/50 rounded-3xl shadow-xl p-6 space-y-4">
          <p className="text-sm uppercase text-gray-500 font-semibold">
            Personalized plan
          </p>
          {plan ? (
            <div className="space-y-3">
              <p className="text-gray-700 whitespace-pre-line">{plan.plan}</p>
              <p className="text-xs text-gray-500">
                Generated at {new Date(plan.generatedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Generate your first plan using the button above. Plans are refined by Gemini AI
              based on your goals and latest intake.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DietPage() {
  return (
    <ProtectedRoute>
      <DietDashboard />
    </ProtectedRoute>
  );
}

