'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary. Catches anything thrown during render of
 * a page within the app segment. `reset()` re-renders the segment from
 * scratch — useful for transient failures.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[balanceven] route error:', error);
  }, [error]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-paper"
      data-theme="dark"
    >
      <p className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/55">
        Something broke
      </p>
      <h1 className="mt-4 max-w-3xl text-center font-display text-section tracking-tighter">
        That didn&apos;t go to plan.
      </h1>
      <p className="mt-4 max-w-lg text-center font-body text-base text-paper/70">
        Try again, or head home and we&apos;ll pretend it never happened.
      </p>
      {error.digest && (
        <p className="mt-6 font-body text-xs text-paper/35">
          ref: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-paper px-7 py-3.5 font-display text-base tracking-tight text-ink transition-colors hover:bg-paper/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-paper px-7 py-3.5 font-display text-base tracking-tight transition-colors hover:bg-paper hover:text-ink"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
