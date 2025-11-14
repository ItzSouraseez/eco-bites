import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key not configured for nutrition-text endpoint');
}

export async function POST(request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const query = body?.query;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Food name/query is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
    ];

const prompt = `You are a nutrition expert. For the food "${query}", provide a JSON response with this exact structure:
{
  "name": "",
  "brand": "",
  "originCountry": "",
  "nutrition": {
    "energy": 0,
    "fat": 0,
    "sugars": 0,
    "salt": 0,
    "protein": 0,
    "fiber": 0,
    "carbs": 0
  },
  "ingredients": "",
  "allergens": [],
  "nutriScore": "A",
  "ecoScore": "B",
  "description": "",
  "packaging": []
}

Rules:
- Provide realistic nutrition per 100g or per serving if 100g not available.
- All numbers must be numeric (no strings with units).
- allergens should be an array of simple strings.
- packaging is list of materials if known.
- Use null when data unavailable.
Return ONLY valid JSON with no extra text.`;

    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Model did not return JSON');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
          data: {
            ...parsed,
            name: parsed.name || query,
            originCountry: parsed.originCountry || null,
            allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
          },
        });
      } catch (error) {
        console.warn(`nutrition-text: model ${modelName} failed`, error);
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to retrieve nutrition data');
  } catch (error) {
    console.error('nutrition-text error:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to fetch nutrition information' },
      { status: 500 }
    );
  }
}

