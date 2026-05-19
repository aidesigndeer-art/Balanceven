import { Loader } from '@/components/ui/Loader';
import { Marquee } from '@/components/ui/Marquee';
import { Hero } from '@/components/sections/Hero';
import { Reveal } from '@/components/sections/Reveal';
import { HeroPin } from '@/components/sections/HeroPin';
import { Actives } from '@/components/sections/Actives';
import { Shop } from '@/components/sections/Shop';
import { Outro } from '@/components/sections/Outro';

const HERO_MARQUEE = [
  'ENERGY',
  'LIFT',
  'NO CRASH',
  '18 COUNT',
  'CLEAN FUEL',
  'FLY BITES',
] as const;

export default function Page() {
  return (
    <>
      <Loader />
      <main>
        <Hero />
        {/* Transition strip between Hero and the pinned scroll act */}
        <Marquee items={HERO_MARQUEE} duration={32} />
        {/* Sensory threshold — scroll-scrubbed iridescent crystal reveal */}
        <Reveal />
        <HeroPin />
        <Actives />
        <Shop />
        <Outro />
      </main>
    </>
  );
}
