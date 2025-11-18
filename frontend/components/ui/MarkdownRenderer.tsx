// components/ui/MarkdownRenderer.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold text-text dark:text-white mb-4 mt-6" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold text-text dark:text-white mb-3 mt-5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold text-text dark:text-white mb-2 mt-4" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-semibold text-text dark:text-white mb-2 mt-3" {...props} />
          ),
          // Customize paragraph
          p: ({ node, ...props }) => (
            <p className="text-text dark:text-gray-300 mb-4 leading-relaxed" {...props} />
          ),
          // Customize links
          a: ({ node, ...props }) => (
            <a
              className="text-primary dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Customize lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 text-text dark:text-gray-300 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 text-text dark:text-gray-300 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-4" {...props} />
          ),
          // Customize blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary dark:border-blue-400 pl-4 italic text-text-light dark:text-gray-400 my-4"
              {...props}
            />
          ),
          // Customize code blocks
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code
                className="bg-gray-100 dark:bg-gray-800 text-text dark:text-gray-300 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              />
            ) : (
              <code
                className="block bg-gray-100 dark:bg-gray-800 text-text dark:text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-sm"
                {...props}
              />
            ),
          // Customize tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-2 text-left text-sm font-semibold text-text dark:text-white"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-text dark:text-gray-300 border-t border-gray-200 dark:border-gray-700" {...props} />
          ),
          // Customize horizontal rules
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />
          ),
          // Customize strong/bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-text dark:text-white" {...props} />
          ),
          // Customize emphasis/italic
          em: ({ node, ...props }) => (
            <em className="italic text-text dark:text-gray-300" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

