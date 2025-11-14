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
    
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro-vision',
      'gemini-pro',
    ];
    
    const errors = [];
    let lastError = null;
    
    // Prompt to extract nutrition data directly from nutrition label
    const nutritionPrompt = `You are analyzing a nutrition facts label image. Extract all nutritional information visible on this label. Return ONLY a valid JSON object with this exact format:

{
  "nutrition": {
    "energy": number in kcal per 100g (or convert from serving size),
    "fat": number in grams per 100g,
    "sugars": number in grams per 100g,
    "salt": number in grams per 100g,
    "protein": number in grams per 100g,
    "fiber": number in grams per 100g,
    "sodium": number in grams per 100g
  },
  "ingredients": "ingredients list as shown on label",
  "allergens": ["allergens listed on label"],
  "servingSize": "serving size information if visible"
}

IMPORTANT:
- Extract values directly from the nutrition facts label
- If values are per serving, convert to per 100g
- Use 0 for values not visible on the label
- Return ONLY the JSON object, no markdown, no code blocks`;

    let nutritionData = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Extracting nutrition from label with model: ${modelName}`);
        
        const nutritionCall = model.generateContent([
          {
            inlineData: {
              data: base64,
              mimeType: file.type || 'image/jpeg',
            },
          },
          nutritionPrompt,
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );
        
        const nutritionResult = await Promise.race([nutritionCall, timeoutPromise]);
        const nutritionResponse = await nutritionResult.response;
        let nutritionText = nutritionResponse.text();
        
        // Parse nutrition data
        let cleanedText = nutritionText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        nutritionData = JSON.parse(cleanedText);
        console.log(`✓ Nutrition data extracted from label`);
        break;
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.warn(`✗ Model ${modelName} failed:`, errorMsg);
        errors.push({ model: modelName, error: errorMsg });
        lastError = modelError;
        continue;
      }
    }
    
    if (!nutritionData) {
      return NextResponse.json(
        { 
          error: 'Unable to extract nutrition data from label',
          message: lastError?.message || 'Failed to extract nutrition',
        },
        { status: 500 }
      );
    }
    
    // Validate and set defaults
    if (!nutritionData.nutrition) {
      nutritionData.nutrition = {
        energy: 0,
        fat: 0,
        sugars: 0,
        salt: 0,
        protein: 0,
        fiber: 0,
        sodium: 0,
      };
    }

    return NextResponse.json({ data: nutritionData }, { status: 200 });
  } catch (error) {
    console.error('Error extracting nutrition from label:', error);
    return NextResponse.json(
      { error: 'Failed to extract nutrition from label', message: error.message },
      { status: 500 }
    );
  }
}

