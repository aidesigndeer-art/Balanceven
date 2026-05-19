# balanceven-web

Marketing site for **Balanceven** — D2C launch of *Fly Bites*, "Energy" gummies (18 count).

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS, CSS variables for theme tokens
- React Three Fiber + Drei + Three (procedural pouch + custom holographic GLSL shader)
- GSAP + ScrollTrigger (scroll choreography), Lenis (smooth scroll)
- Framer Motion (UI animation)
- Self-hosted Space Grotesk (display) + Inter (body) via `@fontsource-variable`

## Brand palette
Strict monochrome: `#000000` and `#FFFFFF` only. Color appears solely inside the pouch render (iridescent foil shader). No greys outside opacity-modulated black/white.

## Typography
- **Display:** Space Grotesk Variable (web-licensed, SIL OFL). Originally specced as Coolvetica — see "Font licensing" below.
- **Body:** Inter Variable.
- **Wordmark + pouch label:** Coolvetica Regular, baked into static SVG/PNG assets only (permitted by Typodermic's Desktop EULA, §2(i)(b)).

## Font licensing — important
The shipped `Coolvetica Rg.otf` in `_brief/` is licensed under Typodermic's **Desktop EULA**, which does **not** permit web embedding via `@font-face`. Live HTML text uses Space Grotesk as a substitute. Coolvetica is used **only** for pre-rendered SVG (`/public/logo/balanceven-{black,white}.svg`) and the baked pouch-label texture — both permitted as "static graphic image" use under the Desktop EULA.

To switch back to Coolvetica for live HTML headlines, purchase a Typodermic **Webfont** license (via MyFonts), drop `coolvetica.woff2` into `/public/fonts/`, and update `app/globals.css` to load it.

## Running locally
```bash
pnpm install
pnpm dev
```
Open http://localhost:3000.

## Project layout
```
app/                # App Router pages + global styles
components/
  three/            # R3F components — pouch, shader, scene
  sections/         # Page sections (Hero, Loader, etc.)
  ui/               # Reusable UI primitives (Nav, Wordmark, Cursor, ...)
lib/                # Hooks, utilities
public/
  fonts/            # Self-hosted woff2 (filled from @fontsource at install)
  logo/             # balanceven-black.svg, balanceven-white.svg
  models/           # Optional .glb drop-in for pouch
  textures/         # Baked label textures
scripts/
  build-wordmark.mjs  # Regenerates wordmark SVGs from Coolvetica OTF
```

## Swapping the placeholder pouch with a real `.glb`
`<FlyBitesPouch />` accepts a `glbUrl` prop. Drop a Draco-compressed `.glb` into `/public/models/`, then:
```tsx
<FlyBitesPouch glbUrl="/models/pouch.glb" />
```
The shader pipeline (holographic foil + label texture) attaches automatically.

## Regenerating the wordmark + pouch label
```bash
pnpm wordmark
node scripts/build-pouch-label.mjs
```
First reads `_brief/coolvetica/Coolvetica Rg.otf` and emits black + white wordmarks to `/public/logo/`. The second bakes the Fly Bites front + back label art to `/public/textures/pouch-label.svg`, which the pouch component rasterizes onto its UV map at runtime.

## License
Source code: proprietary, © 2026 Balanceven.
Coolvetica: © Typodermic Fonts Inc., used under Desktop EULA for static graphic assets only.
