# Festival Runner

3D endless runner. You're a glowing festival-goer dodging crowds, drinks, and security through a psychedelic music festival. Score = how far you go before you eat it.

## Tech

- React 19 + TypeScript + Vite
- React Three Fiber (Three.js) for the 3D scene
- Web Audio API for procedural placeholder music (128 BPM house beat — see [`src/audio/HouseBeat.ts`](src/audio/HouseBeat.ts))
- Deployed to Netlify

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Controls

- `← →` or `A` / `D` — switch lanes
- `Space` / `W` / `↑` — jump
- swipe on mobile

## Audio

Music is currently **synthesized in-browser** — no audio files in the repo yet. A 4-on-the-floor house beat at 128 BPM with kick, hat, clap, acid bass, and a lead stab that ramps in as score climbs.

To swap in real tracks, drop OGG files in `public/audio/music/` (see [music spec](#music-spec)) and replace the `useHouseBeat` import in `src/App.tsx` with a file-based loader.

### Music spec (when ready to swap)

| Track | Length | Purpose |
|---|---|---|
| `menu.ogg` | 60–90s loop | Title screen |
| `run-low.ogg` | 90–120s loop | Gameplay, score 0–500 |
| `run-mid.ogg` | 90–120s loop | Gameplay, score 500–1500 |
| `run-high.ogg` | 90–120s loop | Gameplay, score 1500+ |
| `trip-mode.ogg` | 15–20s loop | Power-up |
| `game-over.ogg` | 3–5s one-shot | Death sting |

Format: OGG Vorbis 160kbps. Seamless loops (no fade in/out). All gameplay tracks at the same BPM/key.

## Build

```bash
npm run build
```

Output goes to `dist/`. Netlify auto-deploys on push to main (see `netlify.toml`).
