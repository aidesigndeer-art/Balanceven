import { Loader } from '@/components/ui/Loader';
import { Nav } from '@/components/ui/Nav';
import { Wordmark } from '@/components/ui/Wordmark';

export default function Page() {
  return (
    <>
      <Loader />
      <Nav />
      <main>
        <section className="flex min-h-screen items-center justify-center">
          <Wordmark height="8vw" />
        </section>
        <section className="flex min-h-screen items-center justify-center border-t border-paper/10">
          <p className="font-display text-section">scroll to test nav state</p>
        </section>
      </main>
    </>
  );
}
