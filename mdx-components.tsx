// This function can be used to customize how MDX renders components
import Link from 'next/link';
import React from 'react';

type ComponentProps = {
  children: React.ReactNode;
  [key: string]: unknown;
};

type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
};

// Regex for extracting language from code block className
const LANGUAGE_REGEX = /language-/;

// MDX Components
import { Callout } from '@/components/mdx/callout';
import { CodeBlock } from '@/components/mdx/code-block';
import { IconHeading } from '@/components/mdx/icon-heading';
import { LinkCard } from '@/components/mdx/link-card';

// UI Components
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function useMDXComponents(
  components: Record<string, React.ComponentType> = {}
) {
  return {
    // Override the default anchor tag to use Next.js Link
    a: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href?: string;
      children: React.ReactNode;
    }) => {
      if (href?.startsWith('http') || href?.startsWith('//')) {
        return (
          <a
            className="text-primary underline hover:text-primary/80"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          className="text-primary underline hover:text-primary/80"
          href={href || '#'}
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Style headings
    h1: ({ children, ...props }: ComponentProps) => {
      const id =
        props.id ||
        (typeof children === 'string'
          ? children
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          : undefined);
      return (
        <h1
          className="mb-4 font-bold text-3xl text-foreground"
          id={id as string | undefined}
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }: ComponentProps) => {
      const id =
        props.id ||
        (typeof children === 'string'
          ? children
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          : undefined);
      return (
        <h2
          className="mt-8 mb-4 font-semibold text-2xl"
          id={id as string | undefined}
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: ComponentProps) => {
      const id =
        props.id ||
        (typeof children === 'string'
          ? children
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          : undefined);
      return (
        <h3
          className="mb-2 font-semibold text-xl"
          id={id as string | undefined}
          {...props}
        >
          {children}
        </h3>
      );
    },

    // Style paragraphs and text
    p: ({ children, ...props }: ComponentProps) => (
      <p className="mb-4 text-muted-foreground" {...props}>
        {children}
      </p>
    ),

    // Style lists
    ul: ({ children, ...props }: ComponentProps) => (
      <ul
        className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground [&>li]:marker:text-muted-foreground"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: ComponentProps) => (
      <ol
        className="mb-4 list-decimal space-y-2 pl-6 text-muted-foreground [&>li]:marker:text-muted-foreground"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: ComponentProps) => (
      <li className="text-muted-foreground" {...props}>
        {children}
      </li>
    ),

    // Style inline code
    code: ({ children, ...props }: ComponentProps) => (
      <code className="rounded bg-secondary px-1 py-0.5 text-sm" {...props}>
        {children}
      </code>
    ),
    // Use CodeBlock component for code blocks (pre elements)
    pre: ({ children, ...props }: ComponentProps) => {
      // If it's not a code element, just render a normal pre
      if (!children || typeof children !== 'object' || !('props' in children)) {
        return <pre {...props}>{children}</pre>;
      }

      // Extract language from the code element's className
      const codeElement = children as React.ReactElement;
      const className =
        (codeElement?.props as CodeElementProps)?.className || '';
      const language = className
        .replace(LANGUAGE_REGEX, '')
        .replace(/\s*code-highlight\s*/g, '')
        .trim();

      // Remove 'code-highlight' from the code element's className
      const codeProps = codeElement.props as CodeElementProps;
      const cleanedCodeElement = React.cloneElement(codeElement, {
        ...codeProps,
        className: (codeProps?.className || '')
          .replace(/\s*code-highlight\s*/g, '')
          .trim(),
      } as React.Attributes & CodeElementProps);

      return (
        <CodeBlock language={language} {...props}>
          {cleanedCodeElement}
        </CodeBlock>
      );
    },

    // Style blockquotes
    blockquote: ({ children, ...props }: ComponentProps) => (
      <blockquote
        className="mb-4 border-primary border-l-4 pl-4 text-muted-foreground italic"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Table components
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,

    // Custom components
    Badge: ({
      children,
      variant = 'secondary',
      ...props
    }: ComponentProps & {
      variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    }) => (
      <Badge variant={variant} {...props}>
        {children}
      </Badge>
    ),
    Card: ({ children, ...props }: ComponentProps) => (
      <Card className="mb-4" {...props}>
        {children}
      </Card>
    ),
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,

    // MDX custom components
    Callout,
    CodeBlock,
    IconHeading,
    LinkCard,

    ...components,
  };
}
