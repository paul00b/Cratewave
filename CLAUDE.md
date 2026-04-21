# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cratewave is a client-side PWA for personalized music discovery, connected to Spotify. It uses Spotify listening data as a starting point and pushes users toward genres they wouldn't explore on their own, using Last.fm for similar artists and Gemini Flash for deep cross-genre recommendations based on mood.

Hybrid: client-side PWA + a single Vercel serverless proxy (`api/gemini.ts`) that holds the Gemini key server-side. Spotify Client ID and Last.fm key live in Vite env vars (public, safe — OAuth PKCE and read-only tag lookups respectively). Gemini key must stay server-only.

## Commands

- `npm run dev` — start Vite dev server (http://localhost:5173)
- `npm run build` — type-check with `tsc -b` then build for production
- `npm run lint` — ESLint
- `npm run preview` — preview production build locally

## Stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin, config in `src/index.css` using `@theme`)
- **vite-plugin-pwa** — service worker with cache-first for assets, network-first for API calls
- **React Router v7** — client-side routing
- **Zustand** — global state (`src/store/index.ts`)

## Architecture

```
api/                → Vercel serverless functions (edge runtime). `gemini.ts` proxies
                      Gemini with the key held in the GEMINI_API_KEY env var.
src/
  pages/            → route-level components (Home, Stats, Discover, Settings)
  components/       → Layout, Nav
  components/ui/    → reusable UI: GlassCard, Skeleton, TimeRangeTabs, MoodSelector,
                      ModeSlider, ArtistCard, TrackCard, DiscoveryCard, DiscoveryLoader, AuthPrompt
  hooks/            → useSpotifyAuth (auth lifecycle)
  services/         → API modules (spotify.ts, lastfm.ts, gemini.ts, recommendations.ts)
  store/            → Zustand store (auth tokens, UI state, seen artists)
  types/            → shared TypeScript types
  utils/            → formatDuration, formatRelativeTime, computeDominantGenres, mood.ts
```

**Data flow:** Pages call services directly for data fetching. Zustand store holds auth tokens, selected tracks, discovery state (mood, mode, timeRange), topArtists cache, and a persistent `seenArtists` set.

**Auth:** Spotify OAuth PKCE flow. `useSpotifyAuth()` is called at the App root to handle callbacks and refresh tokens. Spotify Client ID is a Vite env var (`VITE_SPOTIFY_CLIENT_ID`).

**Env vars:**
- `VITE_SPOTIFY_CLIENT_ID` — client-side, OAuth PKCE
- `VITE_LASTFM_API_KEY` — client-side, read-only API
- `GEMINI_API_KEY` — **server-only** (no VITE_ prefix), used by `api/gemini.ts`

**Local dev with the Gemini proxy:** `npm run dev:vercel` (requires Vercel CLI). Plain `npm run dev` still works for everything except Gemini.

**Recommendations pipeline (`src/services/recommendations.ts`):**
- `buildListeningProfile` — merges short+medium term top artists/tracks, aggregates Last.fm tags, returns known-artists set + dominantTags. Cached 10 min in module scope.
- **Close mode** — weighted Last.fm similar-artists on top 10 seeds, scored by match × seed weight + Last.fm tag overlap with user's dominant tags + mood tag boost/penalty (see `src/utils/mood.ts`). Resolved on Spotify with artist image + top tracks.
- **Far mode** — Gemini proxy, track-level output (`{artist, track, reason, genres}`), rich context (top artists, top tracks, dominant tags, mood-specific boost/avoid tags, explicit avoid-list). Resolved on Spotify with artist image + matched track (fallback to artist popular tracks).
- Both modes dedupe by resolved Spotify `artist.id`, skip the persistent `seenArtists` set in the store, return unified `Recommendation` type.

**Playlist creation:** DiscoveryCard expands to show Spotify tracks via `searchTracks`. Selected tracks accumulate in the store. A floating bar lets users create a Spotify playlist in one click.

## Design System

- Dark mode only, background `#0a0a0f`
- CSS grain overlay via SVG filter on `body::before`
- `.glass` class: `backdrop-blur(16px)`, `bg-white/5`, `border-white/10` — used via `GlassCard` component
- Background halos: `.glow-violet` and `.glow-rose` (radial gradients) in Layout
- Palette: violet (`#8b5cf6`), rose (`#f43f5e`), muted text (`#71717a`)
- Theme tokens defined in `src/index.css` via Tailwind v4 `@theme` directive
- French UI throughout
