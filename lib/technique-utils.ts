import type { Technique } from '@/lib/types';

export function extractTechniqueType(technique: Technique): string | null {
  const typeTag = technique.tags.find((tag) =>
    tag.startsWith('technique-type/')
  );
  if (!typeTag) {
    return null;
  }

  // Extract the type and format it nicely
  const type = typeTag.replace('technique-type/', '');
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function extractApplicableModels(technique: Technique): string[] {
  return technique.tags
    .filter((tag) => tag.startsWith('applicable-models/'))
    .map((tag) => {
      const model = tag.replace('applicable-models/', '');
      // Special case formatting
      switch (model) {
        case 'agnostic':
          return 'Model Agnostic';
        case 'llm':
          return 'LLM';
        case 'cnn':
          return 'CNN';
        case 'gan':
          return 'GAN';
        case 'gam':
          return 'GAM';
        default:
          return model
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }
    });
}

export function extractDataTypes(technique: Technique): string[] {
  return technique.tags
    .filter((tag) => tag.startsWith('data-type/'))
    .map((tag) => {
      const dataType = tag.replace('data-type/', '');
      return dataType.charAt(0).toUpperCase() + dataType.slice(1);
    });
}

export function truncateDescription(
  description: string,
  maxLength = 120
): string {
  if (description.length <= maxLength) {
    return description;
  }

  // Find the last space before maxLength to avoid cutting words
  let cutoff = description.lastIndexOf(' ', maxLength);
  if (cutoff === -1) {
    cutoff = maxLength;
  }

  return `${description.substring(0, cutoff)}...`;
}

// Get a display-friendly name for a tag
export function formatTagName(tag: string): string {
  // Remove the category prefix
  const parts = tag.split('/');
  const name = parts.at(-1) ?? '';

  // Handle special cases
  const specialCases: Record<string, string> = {
    llm: 'Large Language Model',
    cnn: 'Convolutional Neural Network',
    gan: 'Generative Adversarial Network',
    gam: 'Generalized Additive Model',
    rnn: 'Recurrent Neural Network',
    api: 'API',
    ml: 'Machine Learning',
    ai: 'Artificial Intelligence',
    nlp: 'Natural Language Processing',
  };

  if (specialCases[name]) {
    return specialCases[name];
  }

  // Convert kebab-case to Title Case
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get the category prefix from a tag
export function getTagPrefix(tag: string): string {
  const parts = tag.split('/');
  return parts.length > 1 ? parts[0] : '';
}

// Get the tag value without the prefix
export function getTagValue(tag: string): string {
  const parts = tag.split('/');
  return parts.at(-1) ?? tag;
}

// Format tag category for display
export function formatTagCategory(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Group tags by their category
export function groupTagsByCategory(tags: string[]): Record<string, string[]> {
  return tags.reduce(
    (acc, tag) => {
      const category = getTagPrefix(tag);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tag);
      return acc;
    },
    {} as Record<string, string[]>
  );
}
