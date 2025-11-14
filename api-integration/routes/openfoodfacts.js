// Router for OpenFoodFacts-related API endpoints

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

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

module.exports = router;