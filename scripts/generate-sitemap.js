import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateSitemap() {
  // Load data
  const techniques = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../public/data/techniques.json'),
      'utf8'
    )
  );
  const goals = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../public/data/assurance-goals.json'),
      'utf8'
    )
  );
  const tags = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../public/data/tags.json'), 'utf8')
  );

  const baseUrl = 'https://tea-techniques.github.io'; // Update with actual domain
  const currentDate = new Date().toISOString();

  // Define all routes
  const routes = [
    // Core pages
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/techniques', changefreq: 'weekly', priority: 0.9 },
    { url: '/categories', changefreq: 'weekly', priority: 0.8 },
    { url: '/filters', changefreq: 'weekly', priority: 0.8 },
    { url: '/about', changefreq: 'monthly', priority: 0.7 },

    // About pages
    { url: '/about/project-info', changefreq: 'monthly', priority: 0.6 },
    {
      url: '/about/technique-evaluation',
      changefreq: 'monthly',
      priority: 0.6,
    },
    { url: '/about/tag-definitions', changefreq: 'monthly', priority: 0.6 },
    {
      url: '/docs/community-contributions',
      changefreq: 'monthly',
      priority: 0.6,
    },

    // Dynamic technique pages
    ...techniques.map((technique) => ({
      url: `/techniques/${technique.slug}`,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: technique.last_updated || currentDate,
    })),

    // Category pages
    ...goals.map((goal) => ({
      url: `/categories/${goal.slug}`,
      changefreq: 'weekly',
      priority: 0.7,
    })),

    // Filter category pages
    ...Array.from(new Set(tags.map((tag) => tag.category))).map((category) => ({
      url: `/filters/${category}`,
      changefreq: 'weekly',
      priority: 0.6,
    })),

    // Individual filter pages
    ...tags.map((tag) => ({
      url: `/filters/${tag.category}/${tag.slug}`,
      changefreq: 'weekly',
      priority: 0.5,
    })),
  ];

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod || currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Write sitemap to public directory
  fs.writeFileSync(
    path.join(__dirname, '../public/sitemap.xml'),
    sitemap,
    'utf8'
  );
}

// Run the generator
try {
  generateSitemap();
} catch (_error) {
  process.exit(1);
}
