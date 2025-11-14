// Router for OpenFoodFacts-related API endpoints

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Clean and normalize product data
function formatProduct(p) {
  if (!p) return null;

  return {
    name: p.product_name || null,
    brand: p.brands || null,
    image: p.image_front_small_url || null,
    categories: p.categories || null,

    nutriments: p.nutriments || {},

    ecoscore: {
      score: p.ecoscore_score || null,
      grade: p.ecoscore_grade || null
    },

    nutriscore: p.nutriscore_grade || null,
    nova: p.nova_group || null,

    quantity: p.quantity || null,
    labels: p.labels || null,
    allergens: p.allergens || null
  };
}

// GET /api/product/:barcode
// Fetch raw product data from OpenFoodFacts
router.get("/product/:barcode", async (req, res) => {
  const barcode = req.params.barcode;
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data); // return raw API response
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product data" });
  }
});

// GET /api/search?q=milk
// Search products by name using OpenFoodFacts
router.get("/search", async (req, res) => {
  const query = req.query.q;

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data); // return raw search API response
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

module.exports = router;