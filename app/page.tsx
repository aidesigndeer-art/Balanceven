import { Loader } from '@/components/ui/Loader';
import { Nav } from '@/components/ui/Nav';
import { Hero } from '@/components/sections/Hero';
import { HeroPin } from '@/components/sections/HeroPin';

export default function Page() {
  return (
    <>
      <Loader />
      <Nav />
      <main>
        <Hero />
        <HeroPin />
      </main>
    </>
  );
}
