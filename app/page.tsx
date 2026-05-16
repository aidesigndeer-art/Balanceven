import { Loader } from '@/components/ui/Loader';
import { Hero } from '@/components/sections/Hero';
import { HeroPin } from '@/components/sections/HeroPin';
import { Shop } from '@/components/sections/Shop';

export default function Page() {
  return (
    <>
      <Loader />
      <main>
        <Hero />
        <HeroPin />
        <Shop />
      </main>
    </>
  );
}
