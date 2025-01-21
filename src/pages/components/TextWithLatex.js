// components/TextWithLatex.js
import React from 'react';
import katex from 'katex';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

const TextWithLatex = ({ text }) => {
  if (!text) {
    return <div>No content provided</div>; // or any other fallback you prefer
  }

  // Regular expression to match LaTeX expressions enclosed by $$$$
  const parts = text.split(/(\$.*?\$)/);

  return (
    <div>
      {parts.map((part, index) => {
        // Check if the part is a LaTeX expression
        if (part.startsWith('$') && part.endsWith('$')) {
            let ccount = 0;
            for (let i = 0; i < part.length; i++) {
                const element = part[i];
                if (element == '$') {
                    ccount++;
                }
            }
            let latexExpression = '';
            if (ccount >= 4) {
                latexExpression = part.slice(2, -2); // Remove enclosing $$
            } else {
                latexExpression = part.slice(1, -1);
            }

            try {
                const html = katex.renderToString(latexExpression, {
                throwOnError: false,
                displayMode: true,
                });
                return (
                <span
                    key={index}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                );
            } catch (error) {
                console.error("Error rendering LaTeX:", error);
                return <span key={index}>{latexExpression}</span>;
            }
            }
            // If not a LaTeX expression, render as Markdown
            const markdownHtml = md.render(part);
            return (
            <span
                key={index}
                dangerouslySetInnerHTML={{ __html: markdownHtml }}
            />
            );
      })}
    </div>
  );
};

export default TextWithLatex;
