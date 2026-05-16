import { Loader } from '@/components/ui/Loader';
import { Wordmark } from '@/components/ui/Wordmark';

export default function Page() {
  return (
    <>
      <Loader />
      <main className="flex min-h-screen items-center justify-center">
        <Wordmark height="6vw" />
      </main>
    </>
  );
}
