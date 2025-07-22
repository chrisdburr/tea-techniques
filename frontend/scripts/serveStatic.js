#!/usr/bin/env node
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = "/tea-techniques";

// Serve static files from the out directory
app.use(BASE_PATH, express.static(path.join(__dirname, "../out")));

// Redirect root to base path
app.get("/", (req, res) => {
  res.redirect(BASE_PATH);
});

// Handle client-side routing by serving index.html for all routes under base path
app.get(`${BASE_PATH}/*`, (req, res) => {
  const requestedPath = req.path.replace(BASE_PATH, "");
  const filePath = path.join(__dirname, "../out", requestedPath);

  // Check if it's a file request (has extension)
  if (path.extname(requestedPath)) {
    res.sendFile(filePath);
  } else {
    // For routes, try to serve the corresponding HTML file
    res.sendFile(
      path.join(__dirname, "../out", requestedPath, "index.html"),
      (err) => {
        if (err) {
          // Fallback to main index.html for client-side routing
          res.sendFile(path.join(__dirname, "../out/index.html"));
        }
      },
    );
  }
});

app.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}${BASE_PATH}`);
  console.log(`Open your browser to: http://localhost:${PORT}${BASE_PATH}`);
});
