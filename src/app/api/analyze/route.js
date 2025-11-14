import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebase-admin';

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

    // Step 1: Identify the product from the image
    const identificationPrompt = `Look at this food product image and identify what product it is. Return ONLY a JSON object with this exact format:
{
  "name": "exact product name",
  "brand": "brand name if visible, otherwise null"
}

Return ONLY the JSON, no additional text or markdown.`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names - gemini-2.5-flash as primary
    // Order: newest/cheapest first, then fallback to older models
    const modelNames = [
      'gemini-2.5-flash',               // Primary model - latest and most efficient
      'gemini-1.5-flash-latest',        // Latest stable flash
      'gemini-1.5-pro-latest',          // Latest stable pro
      'gemini-1.5-flash',               // Stable flash
      'gemini-1.5-pro',                 // Stable pro
      'gemini-pro-vision',              // Older vision model
      'gemini-pro',                     // Basic model
    ];
    
    const errors = [];
    let lastError = null;
    
    // Step 1: Identify the product from the image
    let productInfo = null;
    let usedModel = null;
    
    // First, try to identify the product from the image
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Step 1 - Identifying product with model: ${modelName}`);
        
        const identificationCall = model.generateContent([
          {
            inlineData: {
              data: base64,
              mimeType: file.type || 'image/jpeg',
            },
          },
          identificationPrompt,
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );
        
        const identificationResult = await Promise.race([identificationCall, timeoutPromise]);
        const identificationResponse = await identificationResult.response;
        let identificationText = identificationResponse.text();
        
        // Parse product identification
        let cleanedText = identificationText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        productInfo = JSON.parse(cleanedText);
        usedModel = modelName;
        console.log(`✓ Product identified: ${productInfo.name} (${productInfo.brand || 'no brand'})`);
        break;
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.warn(`✗ Model ${modelName} failed for identification:`, errorMsg);
        errors.push({ model: modelName, error: errorMsg, step: 'identification' });
        lastError = modelError;
        continue;
      }
    }
    
    if (!productInfo || !productInfo.name) {
      const isApiKeyError = errors.some(e => 
        e.error.includes('API_KEY') || 
        e.error.includes('401') || 
        e.error.includes('403') ||
        e.error.includes('authentication')
      );
      
      const errorMessage = isApiKeyError
        ? 'Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.'
        : 'Unable to identify the product from the image. Please try a clearer image.';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          message: lastError?.message || 'Failed to identify product',
          details: {
            triedModels: modelNames,
            errors: process.env.NODE_ENV === 'development' ? errors : undefined,
          },
        },
        { status: 500 }
      );
    }

    // Step 2: Check shared database first before using Gemini
    let nutritionData = null;
    let fromSharedDb = false;
    
    if (adminDb) {
      try {
        console.log(`Checking shared database for: ${productInfo.name}${productInfo.brand ? ` (${productInfo.brand})` : ''}`);
        
        // Query sharedProducts collection by product name (case-insensitive search)
        const productNameLower = productInfo.name.toLowerCase().trim();
        const brandLower = productInfo.brand ? productInfo.brand.toLowerCase().trim() : null;
        
        // Try exact match first
        let query = adminDb.collection('sharedProducts')
          .where('productName', '>=', productNameLower)
          .where('productName', '<=', productNameLower + '\uf8ff')
          .limit(5);
        
        const snapshot = await query.get();
        
        if (!snapshot.empty) {
          // Find best match (exact name match, then brand match)
          let bestMatch = null;
          let bestScore = 0;
          
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const dbName = (data.productName || '').toLowerCase().trim();
            const dbBrand = data.brand ? data.brand.toLowerCase().trim() : null;
            
            let score = 0;
            // Exact name match
            if (dbName === productNameLower) {
              score += 10;
            } else if (dbName.includes(productNameLower) || productNameLower.includes(dbName)) {
              score += 5;
            }
            
            // Brand match
            if (brandLower && dbBrand) {
              if (dbBrand === brandLower) {
                score += 5;
              } else if (dbBrand.includes(brandLower) || brandLower.includes(dbBrand)) {
                score += 2;
              }
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = { id: doc.id, ...data };
            }
          });
          
          if (bestMatch && bestScore >= 5) {
            console.log(`✓ Found product in shared database: ${bestMatch.productName}`);
            fromSharedDb = true;
            
            // Convert Firestore data to API response format
            nutritionData = {
              name: bestMatch.productName || productInfo.name,
              brand: bestMatch.brand || productInfo.brand || null,
              nutrition: bestMatch.nutrition || {
                energy: 0,
                fat: 0,
                sugars: 0,
                salt: 0,
                protein: 0,
                fiber: 0,
                sodium: 0,
              },
              ingredients: bestMatch.ingredients || 'Not available',
              allergens: bestMatch.allergens || [],
              nutriScore: bestMatch.nutriScore || 'A',
              ecoScore: bestMatch.ecoScore || 'A',
              packaging: bestMatch.packaging || [],
              description: bestMatch.description || `${bestMatch.productName}${bestMatch.brand ? ` by ${bestMatch.brand}` : ''}`,
            };
          }
        }
      } catch (dbError) {
        console.warn('Error querying shared database:', dbError);
        // Continue to Gemini fallback
      }
    }
    
    // Step 3: If not found in shared database, get nutritional information from Gemini
    if (!nutritionData) {
      const productQuery = productInfo.brand 
        ? `${productInfo.brand} ${productInfo.name}`
        : productInfo.name;
      
      const nutritionPrompt = `You are a nutrition expert with access to comprehensive food nutrition databases. Provide detailed nutritional information for: "${productQuery}".

IMPORTANT: Return ONLY a valid JSON object, no markdown, no code blocks, no explanations. Use this exact format:

{
  "name": "${productInfo.name}",
  "brand": ${productInfo.brand ? `"${productInfo.brand}"` : 'null'},
  "nutrition": {
    "energy": 250,
    "fat": 10.5,
    "sugars": 5.2,
    "salt": 1.2,
    "protein": 8.0,
    "fiber": 2.5,
    "sodium": 0.5
  },
  "ingredients": "list of typical ingredients",
  "allergens": ["common allergens"],
  "nutriScore": "B",
  "ecoScore": "B",
  "packaging": ["plastic", "cardboard"],
  "description": "brief product description"
}

Rules:
- Provide realistic nutritional values per 100g based on similar products if exact data unavailable
- All nutrition values must be numbers (use 0 if unknown, not null)
- nutriScore and ecoScore must be exactly "A", "B", "C", "D", or "E"
- ingredients should be a string, allergens should be an array
- Return ONLY the JSON object, nothing else`;

      // Get nutritional data using the identified product name
      let nutritionErrors = [];
      
      for (const modelName of modelNames) {
        try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Step 2 - Getting nutrition data for "${productQuery}" with model: ${modelName}`);
        
        const nutritionCall = model.generateContent(nutritionPrompt);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );
        
        const nutritionResult = await Promise.race([nutritionCall, timeoutPromise]);
        const nutritionResponse = await nutritionResult.response;
        let nutritionText = nutritionResponse.text();
        
        console.log('Raw nutrition response:', nutritionText.substring(0, 200));
        
        // Parse nutrition data
        let cleanedNutritionText = nutritionText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^[^{]*/, '') // Remove anything before first {
          .replace(/[^}]*$/, '') // Remove anything after last }
          .trim();
        
        // Try to find JSON object
        const nutritionJsonMatch = cleanedNutritionText.match(/\{[\s\S]*\}/);
        if (nutritionJsonMatch) {
          cleanedNutritionText = nutritionJsonMatch[0];
        }
        
        nutritionData = JSON.parse(cleanedNutritionText);
        console.log(`✓ Nutrition data retrieved from Gemini for: ${nutritionData.name}`);
        break;
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.warn(`✗ Model ${modelName} failed for nutrition:`, errorMsg);
        nutritionErrors.push({ model: modelName, error: errorMsg });
        lastError = modelError;
        continue;
      }
    }
    }
    
    if (!nutritionData) {
      // If we can't get nutrition data, return basic product info with default values
      console.warn('Could not retrieve nutrition data, using defaults');
      nutritionData = {
        name: productInfo.name,
        brand: productInfo.brand || null,
        nutrition: {
          energy: 0,
          fat: 0,
          sugars: 0,
          salt: 0,
          protein: 0,
          fiber: 0,
          sodium: 0,
        },
        ingredients: 'Unable to retrieve ingredients',
        allergens: [],
        nutriScore: 'A',
        ecoScore: 'A',
        packaging: [],
        description: `Food product: ${productInfo.name}${productInfo.brand ? ` by ${productInfo.brand}` : ''}`,
      };
      
      // Still return the data, but with a warning
      return NextResponse.json(
        { 
          data: nutritionData,
          warning: 'Nutrition data could not be retrieved from knowledge base. Using default values.',
          productInfo: productInfo,
          errors: process.env.NODE_ENV === 'development' ? nutritionErrors : undefined,
        },
        { status: 200 }
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
    
    // Ensure scores are valid
    if (!nutritionData.nutriScore || !['A', 'B', 'C', 'D', 'E'].includes(nutritionData.nutriScore.toUpperCase())) {
      nutritionData.nutriScore = 'A';
    }
    if (!nutritionData.ecoScore || !['A', 'B', 'C', 'D', 'E'].includes(nutritionData.ecoScore.toUpperCase())) {
      nutritionData.ecoScore = 'A';
    }

    return NextResponse.json({ 
      data: nutritionData,
      source: fromSharedDb ? 'sharedDatabase' : 'gemini'
    }, { status: 200 });
  } catch (error) {
    console.error('Error analyzing food image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food image', message: error.message },
      { status: 500 }
    );
  }
}

