import React from 'react';

/**
 * Renders plain text that may contain:
 *   - paragraphs (blank-line separated or single \n)
 *   - bullet lists  (- item, * item, • item)
 *   - numbered lists (1. item, 2. item)
 * Preserves internal whitespace and line breaks.
 */
export default function RichText({ content, className = '' }) {
  if (!content) {
    return <p className={`text-gray-400 italic ${className}`}>No content yet.</p>;
  }

  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line — skip (paragraph separator)
    if (trimmed === '') {
      i += 1;
      continue;
    }

    // Unordered list
    if (/^[-*•]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph — collect until blank line or list start
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'p', text: para.join('\n') });
  }

  return (
    <div className={`space-y-4 text-gray-300 leading-relaxed ${className}`}>
      {blocks.map((b, idx) => {
        if (b.type === 'p') {
          return (
            <p key={idx} style={{ whiteSpace: 'pre-wrap' }}>
              {b.text}
            </p>
          );
        }
        if (b.type === 'ul') {
          return (
            <ul key={idx} className="list-disc list-inside space-y-1 text-gray-300">
              {b.items.map((it, k) => (
                <li key={k} style={{ whiteSpace: 'pre-wrap' }}>
                  {it}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={idx} className="list-decimal list-inside space-y-1 text-gray-300">
            {b.items.map((it, k) => (
              <li key={k} style={{ whiteSpace: 'pre-wrap' }}>
                {it}
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}