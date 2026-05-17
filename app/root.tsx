import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import { Nav } from "~/components/Nav";

import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <Meta />
        <Links />
        <script
          defer
          data-domain="bunge-hub.mwananchi.tech"
          src="https://plausible.c12i.xyz/js/script.js"
        />
      </head>
      <body style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-24 border-t pt-10 pb-12" style={{ borderColor: "var(--color-border)" }}>
        <div
          className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span>
              Developed by{" "}
              <a
                href="https://mwananchi-tech.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "var(--color-accent)" }}
              >
                Mwananchi Tech
              </a>
            </span>
            <span className="hidden sm:inline" style={{ color: "var(--color-border)" }}>
              ·
            </span>
            <Link to="/about" className="hover:underline">
              About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/mwananchi-tech/bunge-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://github.com/mwananchi-tech/bunge-hub/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--color-gold)" }}
            >
              Report an issue
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto px-6 pt-24">
        <h1 className="font-serif text-4xl mb-4">{message}</h1>
        <p style={{ color: "var(--color-muted)" }}>{details}</p>
        {stack && (
          <pre
            className="mt-8 p-4 rounded text-xs overflow-x-auto"
            style={{ background: "var(--color-surface)" }}
          >
            {stack}
          </pre>
        )}
      </main>
    </div>
  );
}
