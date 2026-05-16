import { Loader } from '@/components/ui/Loader';
import { Nav } from '@/components/ui/Nav';
import { Hero } from '@/components/sections/Hero';

export default function Page() {
  return (
    <>
      <Loader />
      <Nav />
      <main>
        <Hero />
      </main>
    </>
  );
}
