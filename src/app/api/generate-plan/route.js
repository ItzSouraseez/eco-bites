import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key not configured for generate-plan endpoint');
}

export async function POST(request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const { goals, logs } = await request.json();

    if (!goals) {
      return NextResponse.json(
        { error: 'Goals are required to generate a plan' },
        { status: 400 }
      );
    }

    const totals = logs?.reduce(
      (acc, log) => {
        acc.calories += Number(log.calories) || 0;
        acc.protein += Number(log.protein) || 0;
        acc.carbs += Number(log.carbs) || 0;
        acc.fat += Number(log.fat) || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const prompt = `You are a certified nutritionist. Generate a personalized diet plan for the rest of the day based on the user's goals and current intake.

Goals (per day):
- Calories: ${goals.calories || 'N/A'} kcal
- Protein: ${goals.protein || 'N/A'} g
- Carbs: ${goals.carbs || 'N/A'} g
- Fat: ${goals.fat || 'N/A'} g

Current intake today:
- Calories: ${Math.round(totals.calories)} kcal
- Protein: ${Math.round(totals.protein)} g
- Carbs: ${Math.round(totals.carbs)} g
- Fat: ${Math.round(totals.fat)} g

Return a brief plan in this format:
- Summary of what's remaining
- Suggest 3 meals/snacks with approximate calories and macros
- One hydration reminder
- Motivational note

Keep it concise, friendly, and practical.`;

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ plan: text });
  } catch (error) {
    console.error('generate-plan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}

