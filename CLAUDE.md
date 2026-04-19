# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cratewave is a client-side PWA for personalized music discovery, connected to Spotify. It uses Spotify listening data as a starting point and pushes users toward genres they wouldn't explore on their own, using Last.fm for similar artists and Gemini Flash for deep cross-genre recommendations based on mood.

No backend. All API keys (Spotify, Gemini, Last.fm) are user-provided via the Settings page and stored in localStorage.

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
src/
  pages/          → route-level components (Home, Stats, Discover, Settings)
  components/     → Layout, Nav
  components/ui/  → reusable UI: GlassCard, Skeleton, TimeRangeTabs, MoodSelector,
                    ModeSlider, ArtistCard, TrackCard, DiscoveryCard, AuthPrompt
  hooks/          → useSpotifyAuth (auth lifecycle), useLastFm, useGemini
  services/       → API modules (spotify.ts, lastfm.ts, gemini.ts)
  store/          → Zustand store (auth tokens, settings, UI state)
  types/          → shared TypeScript types
  utils/          → formatDuration, formatRelativeTime, computeDominantGenres
```

**Data flow:** Pages call services directly for data fetching (in useEffect or event handlers). Zustand store holds auth tokens, settings, selected tracks, discovery state (mood, mode, timeRange), and a topArtists cache shared between Stats and Discover.

**Auth:** Spotify OAuth PKCE flow. `useSpotifyAuth()` is called at the App root (`App.tsx`) to handle OAuth callbacks on any page load. Auto-refreshes tokens 60s before expiry. Tokens in localStorage under `cratewave_spotify_tokens`. Spotify Client ID stored separately under `cratewave_spotify_client_id`.

**Settings persistence:** Gemini and Last.fm API keys stored in localStorage under `cratewave_settings`. No hardcoded keys anywhere. Settings page provides inputs for all three keys.

**Discovery modes:** "Proche" (close) uses Last.fm `getSimilarArtists` for top 5 user artists, deduplicates and filters known artists. "Lointain" (far) uses Gemini Flash to find cross-genre artists matching the selected mood.

**Playlist creation:** DiscoveryCard expands to show Spotify tracks via `searchTracks`. Selected tracks accumulate in the store. A floating bar lets users create a Spotify playlist in one click.

## Design System

- Dark mode only, background `#0a0a0f`
- CSS grain overlay via SVG filter on `body::before`
- `.glass` class: `backdrop-blur(16px)`, `bg-white/5`, `border-white/10` — used via `GlassCard` component
- Background halos: `.glow-violet` and `.glow-rose` (radial gradients) in Layout
- Palette: violet (`#8b5cf6`), rose (`#f43f5e`), muted text (`#71717a`)
- Theme tokens defined in `src/index.css` via Tailwind v4 `@theme` directive
- French UI throughout
