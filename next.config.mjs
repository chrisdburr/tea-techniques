import withBundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

// Regex patterns for chunk splitting
const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;
const FRAMEWORK_REGEX =
  /[\\/]node_modules[\\/](react|react-dom|scheduler|next|@next)[\\/]/;
const UI_LIBRARIES_REGEX = /[\\/]node_modules[\\/]@radix-ui[\\/]/;
const DATA_HANDLING_REGEX =
  /[\\/]node_modules[\\/](@tanstack|react-hook-form|@hookform)[\\/]/;
const UTILITIES_REGEX =
  /[\\/]node_modules[\\/](clsx|class-variance-authority|tailwind-merge|lucide-react|fuse\.js)[\\/]/;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure MDX
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Enable static export
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Enable trailing slashes for better static hosting
  trailingSlash: true,

  // Disabled for static generation compatibility
  reactStrictMode: false,

  // Disable powered by header
  poweredByHeader: false,

  // Configure for GitHub Pages deployment
  basePath: '/tea-techniques',
  assetPrefix: '/tea-techniques',

  // Performance budgets and optimizations
  experimental: {
    optimizePackageImports: [
      // Icons
      'lucide-react',
      // Radix UI components
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-separator',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-avatar',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      // Utility libraries
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
  },

  // Bundle analyzer configuration
  webpack: (config, { dev, isServer }) => {
    // Performance budgets for chunks
    if (!(dev || isServer)) {
      config.performance = {
        maxAssetSize: 250_000, // 250KB
        maxEntrypointSize: 400_000, // 400KB
        hints: 'warning',
      };
    }

    // Optimize chunks
    if (!(dev || isServer)) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20_000,
          cacheGroups: {
            // Framework chunk - React, Next.js core
            framework: {
              test: FRAMEWORK_REGEX,
              name: 'framework',
              priority: 40,
              enforce: true,
            },
            // UI libraries chunk - All Radix UI components
            uiLibraries: {
              test: UI_LIBRARIES_REGEX,
              name: 'ui-libraries',
              priority: 30,
              enforce: true,
            },
            // Form and table libraries
            dataHandling: {
              test: DATA_HANDLING_REGEX,
              name: 'data-handling',
              priority: 25,
              enforce: true,
            },
            // Utilities chunk - Common utilities
            utilities: {
              test: UTILITIES_REGEX,
              name: 'utilities',
              priority: 20,
              enforce: true,
            },
            // Default vendor chunk for remaining dependencies
            vendor: {
              test: NODE_MODULES_REGEX,
              name: 'vendor',
              priority: 10,
              enforce: true,
            },
            // Common chunks for shared app code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            className: ['anchor'],
          },
        },
      ],
      [
        rehypePrismPlus,
        {
          showLineNumbers: false,
          ignoreMissing: true,
        },
      ],
    ],
  },
});

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(withMDX(nextConfig));
