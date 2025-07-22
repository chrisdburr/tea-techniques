#!/usr/bin/env node
import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const BASE_PATH = "/tea-techniques";
const OUT_DIR = join(__dirname, "../out");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Redirect root to base path
  if (pathname === "/") {
    res.writeHead(302, { Location: BASE_PATH });
    res.end();
    return;
  }

  // Strip base path if present
  let filePath = pathname;
  if (pathname.startsWith(BASE_PATH)) {
    filePath = pathname.slice(BASE_PATH.length) || "/";
  }

  // Determine the actual file to serve
  let actualPath;
  const ext = extname(filePath);

  if (ext) {
    // It's a file request
    actualPath = join(OUT_DIR, filePath);
  } else {
    // It's a route request - try to find the corresponding HTML file
    actualPath = join(OUT_DIR, filePath, "index.html");
  }

  try {
    const content = await readFile(actualPath);
    const contentType =
      MIME_TYPES[extname(actualPath)] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (err) {
    if (err.code === "ENOENT") {
      // File not found
      if (!ext) {
        // For routes without extension, try serving the main index.html
        try {
          const indexContent = await readFile(join(OUT_DIR, "index.html"));
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(indexContent);
        } catch {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    } else {
      // Server error
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}${BASE_PATH}`);
  console.log(`Open your browser to: http://localhost:${PORT}${BASE_PATH}`);
});
