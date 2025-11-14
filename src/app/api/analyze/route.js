import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key not configured');
}

export async function POST(request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create prompt for food analysis
    const prompt = `Analyze this food product image and provide detailed nutritional information in the following JSON format:
{
  "name": "product name",
  "brand": "brand name if visible",
  "nutrition": {
    "energy": number in kcal per 100g,
    "fat": number in grams per 100g,
    "sugars": number in grams per 100g,
    "salt": number in grams per 100g,
    "protein": number in grams per 100g,
    "fiber": number in grams per 100g,
    "sodium": number in grams per 100g
  },
  "ingredients": "list of ingredients if visible",
  "allergens": ["list of allergens if visible"],
  "nutriScore": "A, B, C, D, or E based on nutritional quality",
  "ecoScore": "A, B, C, D, or E based on environmental impact",
  "packaging": ["packaging materials if visible"],
  "description": "brief description of the product"
}

Only return valid JSON, no additional text. If information is not visible, use null or 0.`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type || 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let nutritionData;
    try {
      // Clean the response (remove markdown code blocks if present)
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      nutritionData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Response text:', text);
      return NextResponse.json(
        { error: 'Failed to parse nutrition data from image analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: nutritionData }, { status: 200 });
  } catch (error) {
    console.error('Error analyzing food image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food image', message: error.message },
      { status: 500 }
    );
  }
}

