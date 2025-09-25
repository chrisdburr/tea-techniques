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

  // DEVELOPMENT MODE - No static export
  // output: 'export',  // Commented out for development

  // Enable image optimization in development
  images: {
    unoptimized: false,
  },

  // Base path configuration
  basePath: '/tea-techniques',

  // Important: add assetPrefix to ensure public files are served correctly
  assetPrefix: '/tea-techniques',

  // Enable trailing slash to match static export expectations
  trailingSlash: true,

  // React configuration
  reactStrictMode: false,

  // Configure webpack for better chunk splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split vendor chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20_000,
          maxSize: 244_000,
          cacheGroups: {
            framework: {
              test: FRAMEWORK_REGEX,
              name: 'framework',
              priority: 40,
              enforce: true,
            },
            ui: {
              test: UI_LIBRARIES_REGEX,
              name: 'ui-libraries',
              priority: 30,
            },
            dataHandling: {
              test: DATA_HANDLING_REGEX,
              name: 'data-handling',
              priority: 25,
            },
            utilities: {
              test: UTILITIES_REGEX,
              name: 'utilities',
              priority: 20,
            },
            vendor: {
              test: NODE_MODULES_REGEX,
              name: 'vendor',
              priority: 10,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

// Configure MDX support
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypePrismPlus, { showLineNumbers: true, ignoreMissing: true }],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['anchor'],
          },
        },
      ],
    ],
  },
});

// Apply MDX configuration
const mdxConfig = withMDX(nextConfig);

// Apply Bundle Analyzer if ANALYZE is set
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(mdxConfig);
