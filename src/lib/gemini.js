// Note: Gemini API is now called from the server-side API route
// This file is kept for potential future client-side usage
// For now, use the /api/analyze endpoint instead

/**
 * Analyze food image and extract nutritional information using Gemini
 */
export async function analyzeFoodImage(imageFile) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert image file to base64
    const imageBase64 = await fileToBase64(imageFile);

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
          data: imageBase64,
          mimeType: imageFile.type || 'image/jpeg',
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
      throw new Error('Failed to parse nutrition data from image analysis');
    }

    return nutritionData;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw new Error('Failed to analyze food image: ' + error.message);
  }
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Search for similar products in the database using Gemini
 */
export async function searchSimilarProducts(imageFile, db) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageBase64 = await fileToBase64(imageFile);

    const prompt = `Identify this food product. Return only the product name and brand in JSON format:
{
  "name": "product name",
  "brand": "brand name"
}

Use this to search for similar products in a database.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageFile.type || 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const productInfo = JSON.parse(cleanedText);

    return productInfo;
  } catch (error) {
    console.error('Error searching similar products:', error);
    throw error;
  }
}

