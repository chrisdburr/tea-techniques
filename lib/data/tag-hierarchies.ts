/**
 * Tag Hierarchies Configuration
 *
 * This file defines the hierarchical structure for assurance goal tags in the TEA Techniques database.
 * It enables dynamic grouping of tags into meaningful dimensions for better organization and navigation.
 *
 * USAGE:
 * - Import this configuration in components that need to display hierarchical tags
 * - The system automatically groups tags based on their path structure
 * - Each assurance goal can define its own dimensional organisation
 *
 * EXTENDING:
 * To add hierarchical tagging for a new assurance goal:
 * 1. Add a new entry to TAG_HIERARCHIES with the goal name as key
 * 2. Define dimensions with their prefixes and display names
 * 3. Optionally set displayOrder to control the order of dimension groups
 * 4. Add descriptions for each dimension to help users understand the grouping
 *
 * EXAMPLE:
 * fairness: {
 *   dimensions: {
 *     'bias-detection': { name: 'Detection Methods', order: 1 },
 *     'mitigation': { name: 'Mitigation Strategies', order: 2 }
 *   }
 * }
 */

export interface DimensionConfig {
  /** Display name for this dimension category */
  name: string;
  /** Optional order for displaying dimension groups (lower numbers appear first) */
  order?: number;
  /** Optional description explaining this dimension */
  description?: string;
  /** Icon name or component to use for this dimension (optional) */
  icon?: string;
}

export interface HierarchyConfig {
  /**
   * Map of dimension prefixes to their configuration
   * The key is the path segment that identifies this dimension
   * e.g., 'attribution-methods', 'property', 'explains'
   */
  dimensions: Record<string, DimensionConfig>;
  /**
   * Optional display order for dimensions not explicitly ordered
   * Defaults to alphabetical if not specified
   */
  defaultOrder?: string[];
  /**
   * Whether to show dimensions even if they have no tags
   * Useful during development or for placeholder dimensions
   */
  showEmptyDimensions?: boolean;
}

/**
 * Main configuration object for tag hierarchies
 * Each assurance goal that uses hierarchical tagging should have an entry here
 */
export const TAG_HIERARCHIES: Record<string, HierarchyConfig> = {
  /**
   * EXPLAINABILITY HIERARCHY
   * Based on the three-dimensional classification system:
   * 1. Method - HOW the technique works
   * 2. Target - WHAT the technique explains
   * 3. Property - QUALITY characteristics
   */
  explainability: {
    dimensions: {
      // METHOD DIMENSION - Primary algorithmic approaches
      'attribution-methods': {
        name: 'Attribution Methods',
        order: 1,
        description:
          'Techniques that assign importance scores to inputs/features',
        icon: 'chart-bar',
      },
      'surrogate-models': {
        name: 'Surrogate Models',
        order: 2,
        description:
          'Techniques that approximate complex models with interpretable ones',
        icon: 'layers',
      },
      'visualization-methods': {
        name: 'Visualization Methods',
        order: 3,
        description:
          'Techniques focused on visual representation of model behavior',
        icon: 'image',
      },
      'representation-analysis': {
        name: 'Representation Analysis',
        order: 4,
        description: 'Techniques analyzing internal model representations',
        icon: 'cpu',
      },
      'instance-based': {
        name: 'Instance-Based Methods',
        order: 5,
        description: 'Techniques using example-based explanations',
        icon: 'database',
      },
      'uncertainty-analysis': {
        name: 'Uncertainty Analysis',
        order: 6,
        description: 'Techniques quantifying model confidence and robustness',
        icon: 'alert-triangle',
      },
      'causal-analysis': {
        name: 'Causal Analysis',
        order: 7,
        description: 'Techniques examining causal relationships',
        icon: 'git-branch',
      },
      'model-simplification': {
        name: 'Model Simplification',
        order: 8,
        description:
          'Techniques that create simpler, more interpretable models',
        icon: 'minimize',
      },

      // TARGET DIMENSION - What aspect is being explained
      explains: {
        name: 'Explanation Target',
        order: 10,
        description:
          'The aspect of model behavior or data that the technique reveals',
        icon: 'target',
      },

      // PROPERTY DIMENSION - Quality characteristics
      property: {
        name: 'Properties',
        order: 20,
        description: 'Key quality characteristics of the explanation',
        icon: 'check-circle',
      },

      // SCOPE DIMENSION - Explanatory scope
      'explanatory-scope': {
        name: 'Explanatory Scope',
        order: 25,
        description:
          'Whether explanations apply to individual predictions or the entire model',
        icon: 'network',
      },
    },
    defaultOrder: ['Method', 'Target', 'Property', 'Scope'],
    showEmptyDimensions: false,
  },

  /**
   * PLACEHOLDER FOR FUTURE HIERARCHIES
   * Uncomment and modify when implementing hierarchical tagging for other goals
   */

  // fairness: {
  //   dimensions: {
  //     'bias-detection': {
  //       name: 'Bias Detection',
  //       order: 1,
  //       description: 'Methods for identifying unfair bias in models',
  //     },
  //     'bias-mitigation': {
  //       name: 'Bias Mitigation',
  //       order: 2,
  //       description: 'Techniques for reducing or eliminating bias',
  //     },
  //     'fairness-metrics': {
  //       name: 'Fairness Metrics',
  //       order: 3,
  //       description: 'Quantitative measures of fairness',
  //     },
  //   },
  // },

  // safety: {
  //   dimensions: {
  //     'risk-assessment': {
  //       name: 'Risk Assessment',
  //       order: 1,
  //       description: 'Techniques for identifying and evaluating risks',
  //     },
  //     'safety-verification': {
  //       name: 'Safety Verification',
  //       order: 2,
  //       description: 'Methods for verifying safe operation',
  //     },
  //   },
  // },
};

/**
 * Helper function to get dimension info for a tag
 * @param tag - The full tag path (e.g., 'assurance-goal-category/explainability/property/completeness')
 * @returns The dimension configuration if found, null otherwise
 */
export function getDimensionForTag(
  tag: string
): { dimension: string; config: DimensionConfig } | null {
  const parts = tag.split('/');

  // Check if this is an assurance-goal-category tag with hierarchy
  if (parts[0] !== 'assurance-goal-category' || parts.length < 3) {
    return null;
  }

  const goal = parts[1]; // e.g., 'explainability'
  const dimensionKey = parts[2]; // e.g., 'property'

  const hierarchy = TAG_HIERARCHIES[goal];
  if (!hierarchy) {
    return null;
  }

  const config = hierarchy.dimensions[dimensionKey];
  if (!config) {
    return null;
  }

  return { dimension: dimensionKey, config };
}

/**
 * Helper function to add a tag to a grouped dimension
 */
function addTagToGroup(
  grouped: Record<string, { config: DimensionConfig; tags: string[] }>,
  dimension: string,
  config: DimensionConfig,
  tag: string
): void {
  if (!grouped[dimension]) {
    grouped[dimension] = { config, tags: [] };
  }
  grouped[dimension].tags.push(tag);
}

/**
 * Handle special case tags like explanatory-scope
 */
function handleSpecialTag(
  tag: string,
  goal: string,
  hierarchy: HierarchyConfig,
  grouped: Record<string, { config: DimensionConfig; tags: string[] }>
): boolean {
  // Special handling for explanatory-scope tags in explainability
  if (goal === 'explainability' && tag.startsWith('explanatory-scope/')) {
    const scopeConfig = hierarchy.dimensions['explanatory-scope'];
    if (scopeConfig) {
      addTagToGroup(grouped, 'explanatory-scope', scopeConfig, tag);
    }
    return true;
  }
  return false;
}

/**
 * Groups hierarchical tags by their dimensions
 * @param tags - Array of tag strings
 * @param goal - The assurance goal to group tags for
 * @returns Object with dimension names as keys and arrays of tags as values
 */
export function groupTagsByDimension(
  tags: string[],
  goal: string
): Record<string, { config: DimensionConfig; tags: string[] }> {
  const hierarchy = TAG_HIERARCHIES[goal];
  if (!hierarchy) {
    return {};
  }

  const grouped: Record<string, { config: DimensionConfig; tags: string[] }> =
    {};

  for (const tag of tags) {
    // Check for special case tags first
    if (handleSpecialTag(tag, goal, hierarchy, grouped)) {
      continue;
    }

    // Regular hierarchical tag handling
    const dimensionInfo = getDimensionForTag(tag);
    if (dimensionInfo && tag.includes(`assurance-goal-category/${goal}/`)) {
      const { dimension, config } = dimensionInfo;
      addTagToGroup(grouped, dimension, config, tag);
    }
  }

  return grouped;
}

/**
 * Checks if a goal has hierarchical tagging configured
 * @param goal - The assurance goal name
 * @returns True if hierarchical configuration exists
 */
export function hasHierarchicalTags(goal: string): boolean {
  return goal in TAG_HIERARCHIES;
}

/**
 * Gets the display order for dimensions of a specific goal
 * @param goal - The assurance goal name
 * @returns Ordered array of dimension keys
 */
export function getDimensionOrder(goal: string): string[] {
  const hierarchy = TAG_HIERARCHIES[goal];
  if (!hierarchy) {
    return [];
  }

  // Sort dimensions by their configured order
  return Object.entries(hierarchy.dimensions)
    .sort((a, b) => {
      const orderA = a[1].order ?? 999;
      const orderB = b[1].order ?? 999;
      return orderA - orderB;
    })
    .map(([key]) => key);
}
