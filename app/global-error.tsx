'use client';

import { useEffect } from 'react';

/**
 * Top-level error boundary — catches errors thrown by the root layout
 * itself (including ThemeProvider / Nav). Because it replaces the root
 * layout when active, it must render its own <html> and <body>. Inline
 * styles only — at this level globals.css may not have applied.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[balanceven] global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: '#000',
          color: '#fff',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 1.5rem',
          fontFamily:
            'Inter Variable, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          Something broke
        </p>
        <h1
          style={{
            marginTop: '1rem',
            fontFamily:
              'Space Grotesk Variable, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 'clamp(2.5rem, 7vw, 6rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: '48rem',
          }}
        >
          That didn&apos;t go to plan.
        </h1>
        {error.digest && (
          <p style={{ marginTop: 24, fontSize: 12, opacity: 0.35 }}>
            ref:{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>
              {error.digest}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 40,
            background: '#fff',
            color: '#000',
            border: 0,
            borderRadius: 999,
            padding: '14px 28px',
            fontSize: 16,
            cursor: 'pointer',
            fontFamily:
              'Space Grotesk Variable, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
