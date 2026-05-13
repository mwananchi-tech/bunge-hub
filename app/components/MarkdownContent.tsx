import Markdown from "react-markdown";

interface Props {
  content: string;
  className?: string;
}

/**
 * Renders AI-generated summary text as markdown.
 * All summary fields (bills.summary, bill_mentions.summary,
 * topic_speakers.summary) should pass through here once the
 * enrichment pipeline outputs structured markdown.
 */
export function MarkdownContent({ content, className = "" }: Props) {
  return (
    <div className={`prose-sm leading-relaxed ${className}`}
         style={{ color: "var(--color-text)" }}>
      <Markdown
        components={{
          p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em:     ({ children }) => <em className="italic">{children}</em>,
          ul:     ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
          ol:     ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
          li:     ({ children }) => <li>{children}</li>,
          a:      ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
               className="underline" style={{ color: "var(--color-accent)" }}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
