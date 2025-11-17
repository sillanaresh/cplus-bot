import React from 'react';

interface MessageRendererProps {
  content: string;
  onCopy: (text: string) => void;
}

export default function MessageRenderer({ content, onCopy }: MessageRendererProps) {
  // Helper function to render a subset of lines (for details content)
  const renderLines = (lines: string[], startKey = 0): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code block detection
      if (line.trim().startsWith('```')) {
        const language = line.trim().substring(3).trim() || '';
        const codeLines: string[] = [];
        i++;

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }

        let codeContent = codeLines.join('\n');

        // Auto-format JSON
        if (language === 'json' || language === '') {
          try {
            const parsed = JSON.parse(codeContent);
            codeContent = JSON.stringify(parsed, null, 2);
          } catch {
            // Not valid JSON, keep as-is
          }
        }

        elements.push(
          <pre key={`code-${startKey}-${i}`} className="bg-gray-900 text-gray-100 rounded-md p-4 my-3 overflow-x-auto text-xs">
            <code>{codeContent}</code>
          </pre>
        );
        i++;
        continue;
      }

      // Regular line
      if (line.trim()) {
        elements.push(
          <div key={`line-${startKey}-${i}`}>{renderInlineFormatting(line)}</div>
        );
      }
      i++;
    }

    return elements;
  };

  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Heading detection (###, ##, #)
      if (line.trim().startsWith('#')) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2];
          const sizeClasses: { [key: number]: string } = {
            1: 'text-2xl font-bold my-4',
            2: 'text-xl font-bold my-3',
            3: 'text-lg font-semibold my-3',
            4: 'text-base font-semibold my-2',
            5: 'text-sm font-semibold my-2',
            6: 'text-sm font-semibold my-2'
          };

          elements.push(
            React.createElement(
              `h${level}`,
              { key: `heading-${i}`, className: sizeClasses[level] },
              renderInlineFormatting(headingText)
            )
          );
          i++;
          continue;
        }
      }

      // HTML tags detection (details, summary, etc.)
      if (line.trim().startsWith('<details>')) {
        const detailsLines: string[] = [];
        let summaryText = '';
        i++;

        // Look for summary tag
        if (i < lines.length && lines[i].trim().startsWith('<summary>')) {
          summaryText = lines[i].trim().replace(/<\/?summary>/g, '');
          i++;
        }

        // Collect content until </details>
        while (i < lines.length && !lines[i].trim().startsWith('</details>')) {
          detailsLines.push(lines[i]);
          i++;
        }

        // Render the details content using renderLines helper to support code blocks
        const detailsContent = renderLines(detailsLines, i);

        elements.push(
          <details key={`details-${i}`} className="my-3 border border-gray-300 rounded-md p-3">
            <summary className="cursor-pointer font-semibold text-sm mb-2">
              {summaryText}
            </summary>
            <div className="mt-2 text-sm">
              {detailsContent}
            </div>
          </details>
        );
        i++;
        continue;
      }

      // Code block detection (```language)
      if (line.trim().startsWith('```')) {
        const language = line.trim().substring(3);
        const codeLines: string[] = [];
        i++;

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }

        let codeContent = codeLines.join('\n');

        // Auto-format JSON with 2-space indentation (industry standard)
        if (language === 'json' || language === '') {
          try {
            const parsed = JSON.parse(codeContent);
            codeContent = JSON.stringify(parsed, null, 2);
          } catch {
            // Not valid JSON, keep as-is
          }
        }

        elements.push(
          <div key={`code-${i}`} className="relative my-3">
            <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto text-xs">
              <code>{codeContent}</code>
            </pre>
            <button
              onClick={() => onCopy(codeContent)}
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="Copy code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        );
        i++;
        continue;
      }

      // Table detection (markdown tables start with |)
      if (line.trim().startsWith('|') && lines[i + 1]?.includes('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }

        elements.push(renderTable(tableLines, `table-${i}`));
        continue;
      }

      // Empty lines
      if (line.trim() === '') {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        i++;
        continue;
      }

      // Render line with inline formatting
      elements.push(
        <div key={`line-${i}`} className="my-2 text-sm">
          {renderInlineFormatting(line)}
        </div>
      );
      i++;
    }

    return elements;
  };

  const renderTable = (tableLines: string[], key: string) => {
    if (tableLines.length < 2) return null;

    const parseRow = (row: string) => {
      return row
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
    };

    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(2).map(parseRow); // Skip separator line

    return (
      <table key={key} className="min-w-full my-4 text-sm">
        <thead className="border-b-2 border-gray-300" style={{ backgroundColor: '#EBE6D8' }}>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-3 py-2 text-left font-semibold border border-gray-300">
                {renderInlineFormatting(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#F5F1E8' : '#EBE6D8' }}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3 py-2 border border-gray-200">
                  {renderInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderInlineFormatting = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      // Handle inline code
      if (match[1]) {
        const code = match[1].slice(1, -1); // Remove backticks
        parts.push(
          <code key={match.index} className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">
            {code}
          </code>
        );
      }
      // Handle bold
      else if (match[2]) {
        const boldText = match[2].slice(2, -2); // Remove **
        parts.push(
          <strong key={match.index} className="font-semibold">
            {boldText}
          </strong>
        );
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <div className="text-sm">{renderContent()}</div>;
}
