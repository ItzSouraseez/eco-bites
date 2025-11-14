// Basic Express server setup

const express = require("express");
const app = express();
const port = 5001;

// Parse incoming JSON requests
app.use(express.json());

// Mount API routes
const ofRoutes = require("./routes/openfoodfacts");
app.use("/api", ofRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});