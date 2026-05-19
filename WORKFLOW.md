# Balanceven workflow — single push point

This file is the source of truth for how we ship changes to balanceven.vercel.app.
It's read by Claude at the start of every Cowork session so the workflow stays consistent.

## The one rule

**Only the laptop (Siddharth's MacBook Air) pushes to GitHub. Period.**

No exceptions:
- ❌ Implementation guy does NOT push from office PC.
- ❌ Implementation guy does NOT edit via GitHub web UI.
- ❌ No second GitHub Desktop clones, no `git push` from any other machine.

This guarantees there is exactly one source of truth flowing to GitHub, so push conflicts and divergent history are mathematically impossible.

## The five-step deploy loop

1. **Edit files.** Either machine — laptop or office PC. Edits can come from Claude (Cowork), VS Code, or any text editor.
2. **Syncthing mirrors files to the laptop.** Office PC edits flow to the laptop's `~/balanceven-web/` automatically within seconds.
3. **At the laptop, before working: confirm Syncthing is "Up to Date"** on the `balanceven-web` folder (open the Syncthing UI to check).
4. **Iterate and preview at localhost:3001** via `pnpm dev` (running in a Terminal tab inside `~/balanceven-web/`).
5. **Ship to production**:

   ```bash
   cd ~/balanceven-web
   git status                                # sanity-check what changed
   git add -A
   git commit -m "what changed in this push"
   git push
   ```

   Vercel auto-rebuilds within 30–90 seconds. The new build is live at https://balanceven.vercel.app.

## Critical context

- **Local folder of truth:** `/Users/siddharth/balanceven-web/`
- **GitHub repo:** https://github.com/aidesigndeer-art/Balanceven
- **Vercel production URL:** https://balanceven.vercel.app
- **Vercel project name:** `balanceven` (project id `prj_YiVngItk3ThsXVWvLSVlLso8dEqP`)
- **Display font:** Coolvetica Regular, self-hosted at `/public/fonts/coolvetica.otf`. Webfont-licensed.
- **Body font:** Inter Variable via `@fontsource-variable/inter`.
- **Brand palette:** strict monochrome black `#000000` + white `#FFFFFF`. Color appears ONLY inside the pouch render (iridescent foil) and as opacity-modulated variations of black/white.

## Project structure

```
~/balanceven-web/
├── app/                   # Next.js App Router pages
│   ├── page.tsx           # Home — Loader, Marquee, Hero, HeroPin, Actives, Shop, Outro
│   ├── layout.tsx         # Root layout, theme, smooth scroll, nav
│   ├── globals.css        # Coolvetica @font-face, Lenis CSS, brand tokens
│   ├── checkout/page.tsx  # Checkout route
│   └── error.tsx, not-found.tsx, template.tsx, global-error.tsx
├── components/
│   ├── sections/          # Hero, HeroPin, Actives, Shop, Outro
│   ├── three/             # Procedural pouch + holographic shader (R3F)
│   └── ui/                # Loader, Marquee, Nav, Wordmark, SmoothScroll, MagneticButton
├── lib/
│   ├── theme.tsx          # dark/light data-theme provider
│   ├── hooks/useCursor.ts
│   └── store/cart.ts      # Zustand cart store with persist
├── public/
│   ├── fonts/coolvetica.otf
│   ├── logo/balanceven-{black,white}.svg
│   ├── products/pouch-{front,back,side,top,bottom,three-quarter}.png
│   └── textures/pouch-label.svg
├── scripts/
│   ├── build-wordmark.mjs # Regenerates wordmark SVG from Coolvetica OTF
│   └── build-pouch-label.mjs
├── _brief/                # Brand reference + Coolvetica Desktop EULA files
└── WORKFLOW.md            # ← this file
```

## When Claude starts a new Cowork session, it should:

1. Read this file.
2. Read prior session transcripts via `list_sessions` + `read_transcript`.
3. Check git state of `~/balanceven-web/`: any uncommitted changes? Any unpushed commits?
4. Check Vercel via the Vercel MCP: latest deployment state? Matches local?
5. Surface anything pending in plain English before doing new work.

## Connected services

- **Vercel MCP** (team `team_sC32R2EfMmd1cofk2fN0G29I`) — read deployments, build logs, fetch live URLs.
- **GitHub Integration** — read-only, for repo browsing context.
- **Syncthing** — file mirroring between laptop and office PC. Currently mirrors entire `~/balanceven-web/` folder including `.git/`. Risk acknowledged; mitigated by single-push-point discipline.

## Things to know about this project

- **Implementation guy** sometimes works on the office PC. Files he edits sync via Syncthing to the laptop. He does not push directly.
- **Coolvetica** is webfont-licensed for live HTML use. Desktop EULA is also included (for SVG wordmark generation via `build-wordmark.mjs`).
- **Typography rule:** all display text uses "natural" Coolvetica spacing — `letterSpacing: 0`, `lineHeight: 1`, no negative tracking, no tight leading. The Tailwind config and components were systematically updated to enforce this; new code should follow.
- **The pouch** is a photo composite (six angle photos crossfaded via cursor position), not a real 3D model. A `.glb` swap is supported via the `glbUrl` prop on `<FlyBitesPouch />` when a real model is ready.
- **Commerce path:** currently a frontend prototype. Cart works locally (Zustand persist). Real payments / Shopify headless integration is a future step.
