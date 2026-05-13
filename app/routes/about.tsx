import { type ReactNode } from "react";
import { Link } from "react-router";
// Vite ?raw import — bundled at build time, no runtime fs access needed
import aboutContent from "~/content/about.md?raw";
import Markdown from "react-markdown";

export function meta() {
  return [{ title: "About | Bunge Hub" }];
}

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Markdown
        components={{
          // h1 — page hero
          h1: ({ children }) => (
            <div className="mb-12">
              <h1 className="font-serif text-4xl font-light mb-2">{children}</h1>
              <p className="text-base" style={{ color: "var(--color-muted)" }}>
                Kenya's parliamentary record, open and queryable.
              </p>
            </div>
          ),
          // h2 — section headings
          h2: ({ children }) => (
            <h2 className="font-serif text-xl mb-3 mt-10 first:mt-0">{children}</h2>
          ),
          // Wrap each section's content in muted colour
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-muted)" }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-3 mb-4 text-sm" style={{ color: "var(--color-muted)" }}>
              {children}
            </ul>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-medium" style={{ color: "var(--color-text)" }}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => {
            const isGithub = href?.includes("github.com/mwananchi-tech/bunge-hub/issues");
            if (isGithub) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer"
                   className="underline" style={{ color: "var(--color-accent)" }}>
                  {children}
                </a>
              );
            }
            // Internal-ish or mzalendo links
            return (
              <a href={href} target="_blank" rel="noopener noreferrer"
                 className="underline" style={{ color: "var(--color-accent)" }}>
                {children}
              </a>
            );
          },
          // GitHub links at the end rendered as buttons
          blockquote: ({ children }) => (
            <blockquote className="pl-4 border-l-2 italic text-sm mb-3"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
              {children}
            </blockquote>
          ),
        }}
      >
        {aboutContent}
      </Markdown>

      {/* Open source action buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="https://github.com/mwananchi-tech/bunge-hub"
           target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm"
           style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
          <GithubIcon />
          mwananchi-tech/bunge-hub
        </a>
        <a href="https://github.com/mwananchi-tech/bunge-hub/issues/new"
           target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm"
           style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
          Report an issue
        </a>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}
