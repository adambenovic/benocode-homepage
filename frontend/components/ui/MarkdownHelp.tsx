// components/ui/MarkdownHelp.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const MarkdownHelp: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Markdown Formatting Guide</CardTitle>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:underline text-sm"
          >
            {isExpanded ? 'Hide' : 'Show'} Guide
          </button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Headings</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                # Heading 1<br />
                ## Heading 2<br />
                ### Heading 3<br />
                #### Heading 4
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Text Formatting</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                **Bold text**<br />
                *Italic text*<br />
                ***Bold and italic***<br />
                ~~Strikethrough~~
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Lists</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                - Unordered item 1<br />
                - Unordered item 2<br />
                <br />
                1. Ordered item 1<br />
                2. Ordered item 2
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Links</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                [Link text](https://example.com)
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Blockquotes</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                {`> This is a blockquote`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Code</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                `Inline code`<br />
                <br />
                ```<br />
                Code block<br />
                Multiple lines<br />
                ```
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Horizontal Rule</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                ---
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text dark:text-white mb-2">Tables</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded font-mono text-xs">
                | Header 1 | Header 2 |<br />
                | -------- | -------- |<br />
                | Cell 1 | Cell 2 |<br />
                | Cell 3 | Cell 4 |
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

