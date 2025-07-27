'use client';

import React, { useState } from 'react';
import { Check, Copy } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
  title?: string;
  className?: string;
}

const languageNames: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  md: 'Markdown',
  markdown: 'Markdown',
  yaml: 'YAML',
  yml: 'YAML',
  sql: 'SQL',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  r: 'R',
  dockerfile: 'Dockerfile',
  xml: 'XML',
  toml: 'TOML',
  ini: 'INI',
  graphql: 'GraphQL',
  plaintext: 'Plain Text',
  text: 'Plain Text',
};

export function CodeBlock({
  children,
  language,
  title,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('');
    }
    if (node && typeof node === 'object' && 'props' in node) {
      const element = node as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      return extractText(element.props?.children);
    }
    return '';
  };

  const handleCopy = async () => {
    const text = extractText(children);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean up the language string - remove "code-highlight" if present
  const cleanLanguage =
    language?.replace(/\s*code-highlight\s*/g, '').trim() || '';
  const displayLanguage = cleanLanguage
    ? languageNames[cleanLanguage.toLowerCase()] || cleanLanguage
    : '';

  return (
    <div className="my-6">
      {(title || displayLanguage) && (
        <div className="flex items-center justify-between rounded-t-lg bg-muted px-4 py-2 text-sm">
          {title && <span className="font-medium">{title}</span>}
          {displayLanguage && !title && (
            <span className="text-muted-foreground">{displayLanguage}</span>
          )}
          {title && displayLanguage && (
            <span className="text-muted-foreground">{displayLanguage}</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'group relative overflow-x-auto rounded-lg bg-muted/50 dark:bg-zinc-900',
          title || displayLanguage ? 'rounded-t-none' : '',
          className
        )}
      >
        <div className="p-2">
          {typeof children === 'object' && children && 'props' in children ? (
            // If children is a React element (code element), clone it with proper styles
            <pre className="m-0 overflow-x-auto bg-transparent p-0">
              {React.cloneElement(
                children as React.ReactElement<{ className?: string }>,
                {
                  className: cn(
                    (children as React.ReactElement<{ className?: string }>)
                      .props?.className,
                    'bg-transparent'
                  ),
                }
              )}
            </pre>
          ) : (
            // Otherwise render as-is
            <pre className="m-0 overflow-x-auto bg-transparent p-0">
              {children}
            </pre>
          )}
        </div>
        <Button
          aria-label="Copy code"
          className={cn(
            'absolute top-3 right-3 h-8 w-8 p-0',
            'opacity-0 transition-opacity group-hover:opacity-100'
          )}
          onClick={handleCopy}
          size="sm"
          variant="secondary"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
