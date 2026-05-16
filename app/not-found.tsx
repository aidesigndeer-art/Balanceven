import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';

export const metadata = {
  title: '404 — balanceven',
};

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-paper"
      data-theme="dark"
    >
      <p className="font-display text-[clamp(6rem,18vw,14rem)] leading-none tracking-tighter">
        404
      </p>
      <h1 className="mt-6 font-display text-section tracking-tighter">
        Page not found.
      </h1>
      <p className="mt-4 max-w-md text-center font-body text-base text-paper/70">
        The page you&apos;re after doesn&apos;t exist, or moved.
      </p>
      <Link
        href="/"
        className="mt-10 rounded-full border border-paper px-7 py-3.5 font-display text-base tracking-tight transition-colors hover:bg-paper hover:text-ink"
      >
        Back to home
      </Link>
      <div className="mt-20">
        <Wordmark variant="white" height="1.1rem" />
      </div>
    </main>
  );
}
