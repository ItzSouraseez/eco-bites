import axios from 'axios';

const OFF_API_BASE = 'https://world.openfoodfacts.org';

/**
 * Search for products by query
 */
export async function searchProducts(query) {
  try {
    const response = await axios.get(`${OFF_API_BASE}/cgi/search.pl`, {
      params: {
        search_terms: query,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 20,
        fields: 'code,product_name,brands,image_url,ecoscore_grade,nutriscore_grade',
      },
    });

    if (!response.data || !response.data.products) {
      return [];
    }

    return response.data.products
      .filter((product) => product.product_name && product.code)
      .map((product) => ({
        id: product.code,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || 'Unknown Brand',
        image: product.image_url || '/placeholder.svg',
        nutriScore: product.nutriscore_grade?.toUpperCase() || null,
        ecoScore: product.ecoscore_grade?.toUpperCase() || null,
      }));
  } catch (error) {
    console.error('Error searching products:', error);
    throw new Error('Failed to search products');
  }
}

/**
 * Get full product details by ID
 */
export async function getProductById(id) {
  try {
    const response = await axios.get(`${OFF_API_BASE}/api/v0/product/${id}.json`);

    if (!response.data || response.data.status === 0) {
      throw new Error('Product not found');
    }

    const product = response.data.product;
    return normalizeProductData(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product details');
  }
}

/**
 * Normalize OpenFoodFacts data to uniform schema
 */
function normalizeProductData(product) {
  // Extract nutrition values
  const nutrition = product.nutriments || {};
  
  // Extract additives
  const additives = product.additives_tags
    ? product.additives_tags.map((tag) => tag.replace('en:', '').toUpperCase())
    : [];

  // Extract packaging
  const packaging = product.packaging_tags
    ? product.packaging_tags.map((tag) => tag.replace('en:', '').replace(/-/g, ' '))
    : [];

  // Extract carbon footprint if available
  const carbonFootprint = product.ecoscore_data?.agribalyse?.co2_total
    ? parseFloat(product.ecoscore_data.agribalyse.co2_total)
    : null;

  return {
    id: product.code || product._id,
    name: product.product_name || product.abbreviated_product_name || 'Unknown Product',
    brand: product.brands || 'Unknown Brand',
    image: product.image_url || product.image_front_url || '/placeholder.svg',
    nutriScore: product.nutriscore_grade?.toUpperCase() || null,
    ecoScore: product.ecoscore_grade?.toUpperCase() || null,
    additives,
    nutrition: {
      energy: nutrition['energy-kcal_100g'] || nutrition.energy_100g || 0,
      fat: nutrition.fat_100g || 0,
      sugars: nutrition.sugars_100g || 0,
      salt: nutrition.salt_100g || 0,
      protein: nutrition.proteins_100g || 0,
      saturatedFat: nutrition['saturated-fat_100g'] || 0,
      fiber: nutrition.fiber_100g || 0,
      sodium: nutrition.sodium_100g || 0,
    },
    packaging,
    carbonFootprint,
    ingredients: product.ingredients_text || 'No ingredients listed',
    categories: product.categories_tags
      ? product.categories_tags.map((tag) => tag.replace('en:', '').replace(/-/g, ' '))
      : [],
  };
}

