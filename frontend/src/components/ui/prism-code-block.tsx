"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import Prism from "prismjs";

// Import Prism CSS - you need to import this once in your app
// You can add this to your globals.css or layout.tsx
import "prismjs/themes/prism-tomorrow.css";

// Load additional languages
import "prismjs/components/prism-bash";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";

interface PrismCodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

// Add additional CSS for our code blocks
const codeBlockStyles = `
  .code-block pre {
    margin: 0;
    padding: 1rem;
    overflow: auto;
    border-radius: 0;
    background: #1e1e1e !important;
  }
  .code-block code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

// Add the styles to the document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = codeBlockStyles;
  document.head.appendChild(styleElement);
}

export const PrismCodeBlock: React.FC<PrismCodeBlockProps> = ({
  code,
  language = "bash",
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // Map component prop language values to Prism's expected format
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    python: "python",
    bash: "bash",
    sh: "bash",
    json: "json",
  };

  // Get the correct language or fallback to plain text
  const prismLanguage = languageMap[language] || language || "plaintext";

  useEffect(() => {
    // Highlight the code
    if (typeof window !== "undefined") {
      const highlight = () => {
        if (Prism.languages[prismLanguage]) {
          const html = Prism.highlight(
            code,
            Prism.languages[prismLanguage],
            prismLanguage,
          );
          setHighlightedCode(html);
        } else {
          // Fallback to plain text
          setHighlightedCode(escapeHtml(code));
        }
      };

      highlight();
    }
  }, [code, prismLanguage]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code", error);
    }
  };

  // Helper function to escape HTML special characters
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return (
    <div
      className={cn(
        "relative rounded-md overflow-hidden my-4 border border-gray-700",
        className,
      )}
    >
      {/* Language tab */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 text-xs text-gray-200 border-b border-gray-700">
        <span className="font-mono">
          {language === "tsx" || language === "jsx"
            ? language.toUpperCase()
            : language.charAt(0).toUpperCase() + language.slice(1)}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-gray-800 text-gray-300 transition-colors"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="code-block bg-gray-900">
        <pre>
          <code
            className={`language-${prismLanguage}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
};

export default PrismCodeBlock;
