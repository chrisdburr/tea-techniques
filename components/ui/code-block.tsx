'use client';

import { useState } from 'react';
import { Check, Copy } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

interface ReactElementWithProps extends React.ReactElement {
  props: {
    children?: React.ReactNode;
  };
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('');
    }
    if (node && typeof node === 'object' && 'props' in node) {
      const element = node as ReactElementWithProps;
      return extractText(element.props?.children || '');
    }
    return '';
  };

  const handleCopy = async () => {
    const text = extractText(children);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <pre
        className={cn(
          'overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm dark:bg-zinc-900',
          className
        )}
      >
        <code className={language ? `language-${language}` : ''}>
          {children}
        </code>
      </pre>
      <Button
        aria-label="Copy code"
        className={cn(
          'absolute top-2 right-2 h-8 w-8 p-0',
          'opacity-0 transition-opacity group-hover:opacity-100',
          'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        )}
        onClick={handleCopy}
        size="sm"
        variant="ghost"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
