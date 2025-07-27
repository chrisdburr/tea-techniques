import type { LucideIcon } from '@/components/icons';
import {
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  Package,
} from '@/components/icons';
import type { Resource } from './types';

export function getResourceIcon(
  sourceType?: Resource['source_type']
): LucideIcon {
  switch (sourceType) {
    case 'technical_paper':
      return FileText;
    case 'software_package':
      return Package;
    case 'documentation':
      return BookOpen;
    case 'tutorial':
      return GraduationCap;
    default:
      return ExternalLink;
  }
}

export function getResourceTypeLabel(
  sourceType?: Resource['source_type']
): string {
  switch (sourceType) {
    case 'technical_paper':
      return 'Research Paper';
    case 'software_package':
      return 'Software Package';
    case 'documentation':
      return 'Documentation';
    case 'tutorial':
      return 'Tutorial';
    default:
      return 'Resource';
  }
}

export function formatAuthors(authors?: string[]): string {
  if (!authors || authors.length === 0) {
    return '';
  }

  if (authors.length === 1) {
    return authors[0];
  }
  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`;
  }
  if (authors.length === 3) {
    return `${authors[0]}, ${authors[1]}, and ${authors[2]}`;
  }
  return `${authors[0]} et al.`;
}

export function formatPublicationDate(date?: string): string {
  if (!date) {
    return '';
  }

  // Parse ISO date format (YYYY-MM-DD)
  const dateObj = new Date(date);

  if (Number.isNaN(dateObj.getTime())) {
    return date; // Return as-is if not a valid date
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString('en-US', options);
}
