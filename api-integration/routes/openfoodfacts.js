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
// Fetch and return a cleaned product from OpenFoodFacts
router.get("/product/:barcode", async (req, res) => {
  const barcode = req.params.barcode;

  // Validate barcode
  if (!barcode || barcode.length < 5) {
    return res.status(400).json({ error: "Invalid barcode" });
  }

  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch product data" });
    }

    const data = await response.json();

    // Product not found
    if (!data || data.status === 0 || !data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cleaned = formatProduct(data.product);
    return res.json(cleaned);

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/search?q=milk
// Search products by name and return cleaned results
router.get("/search", async (req, res) => {
  const query = req.query.q;

  // Validate query
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Missing search query" });
  }

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch search results" });
    }

    const data = await response.json();
    const products = data.products || [];

    // If no products found
    if (products.length === 0) {
      return res.json({ count: 0, items: [] });
    }

    const cleaned = products
      .filter(p => p && p.product_name)
      .map(p => formatProduct(p));

    return res.json({
      count: cleaned.length,
      items: cleaned
    });

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;