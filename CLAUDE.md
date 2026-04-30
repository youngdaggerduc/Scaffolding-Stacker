# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Commands

**Backend** (from `backend/`, venv at `backend/venv/`):
```bash
source venv/Scripts/activate            # Git Bash on Windows
uvicorn app.main:app --reload --port 8001
pip install -r requirements.txt
```

**Frontend** (from `frontend/`):
```bash
npm run dev      # dev server — runs on :5173 or :5174 if port taken
npm run build    # production build -> dist/
npm run lint
```

No test suite exists yet.

---

## Architecture — two independent apps over HTTP

- **`backend/`** — FastAPI + Tortoise ORM. Entrypoint `app/main.py`. DB config in `app/config.py` reads `DATABASE_URL` from `backend/.env` (default: `sqlite://db.sqlite3`). Routers live under `app/routers/`. The `/api` prefix is set per-router.
- **`frontend/`** — Vite + React 19. `vite.config.js` proxies `/api/*` → `http://localhost:8000`. Entrypoint `src/App.jsx`.

---

## Game — Scaffold Stacker

A 3D physics arcade stacking game. Stack scaffolding pieces to build as tall as possible.

### Stack so far (session 2026-04-29)

**Step 1 — Scene foundation**
- Three.js scene via `@react-three/fiber` + `@react-three/drei`
- Physics world via `cannon-es` (manual integration, no `@react-three/cannon`)
- Ambient + directional + point lights, shadow maps
- `Ground` — static `CANNON.Plane` + visual mesh + drei `Grid` overlay

**Step 2 — Core game loop**
- `SwingingPiece` — sine-wave oscillator, writes position to a `positionRef` each frame
- `DroppedPiece` — cannon body with `angularFactor.set(0,0,0)` (rotation locked), syncs group position to physics
- `GameScene` — orchestrates phases: `swinging → falling → swinging | gameover`
- SPACE drops the current piece; velocity threshold detects settle
- `CameraRig` — lerps camera Y toward `stackTopY`, adds sway + shake

**Step 3 — Juice / polish**
- Screen shake on game over (decaying random camera offset, 0.8s)
- Tower sway grows with stack height (mounting tension)
- Score pop — CSS keyframe bounce on each piece landed
- Landing scale punch — `scalePunch` ref fires on settle, sine-curve pop to 1.1x
- drei `Grid` floor with orange section lines

**Step 4 — Scaffolding theme**
- 3 piece types: Standard (vertical tube), Ledger (horizontal tube), Platform (flat board)
- All pieces lock orientation via `body.angularFactor.set(0,0,0)` — no tumbling, pure timing game
- `PieceMesh.jsx` — shared visual component used by both SwingingPiece and DroppedPiece
- Standard visual: cylinder + end caps + coupler rings (proper scaffold tube look)
- Ledger visual: horizontal cylinder + end caps + centre coupler ring
- `ScaffoldFrame` — decorative background scaffold that grows a floor for every piece landed; poles always full height, ledgers/braces/boards appear as score climbs
- Physics: all pieces use `CANNON.Box` (box contacts are stable for stacking)
- `SAPBroadphase` + `solver.iterations = 20` for stable tall-stack physics

**Step 5 — Height counter**
- Live `X.Xm HIGH` display in HUD (green, updates per settle)
- Game over screen shows metres alongside pieces placed
- `stackTopY` tracked via `Math.max` so toppled/slid pieces never lower the height

---

## File map

```
frontend/src/
  App.jsx                    — Canvas, HUD overlay, score/height/pieceType state, game over screen
  App.css                    — scorePop keyframe animation
  index.css                  — full-bleed reset
  constants.js               — PIECE_TYPES, getPieceHeight(), randomPieceType()
  components/
    GameScene.jsx            — phase state machine, SPACE handler, fell-off detection, ScaffoldFrame
    SwingingPiece.jsx        — sine oscillator, writes positionRef each frame
    DroppedPiece.jsx         — cannon body (rotation locked), settle detection, scale punch
    PieceMesh.jsx            — shared visual geometry for all 3 piece types
    CameraRig.jsx            — camera lerp up, sway, game-over shake
    Ground.jsx               — static cannon plane + drei Grid
    ScaffoldFrame.jsx        — background scaffold grows with score
  physics/
    PhysicsProvider.jsx      — CANNON.World (SAPBroadphase, 20 iterations), useFrame step, context
  hooks/
    usePhysicsBody.js        — generic hook (not currently used by game pieces — DroppedPiece is inline)
```

---

## Key patterns

**Physics integration** — `PhysicsProvider` lives inside `<Canvas>` so it can call `useFrame`. It exposes the world via `useWorld()`. Each `DroppedPiece` creates its own `CANNON.Body` in `useEffect`, removes it on unmount.

**Rotation lock** — `body.angularFactor.set(0, 0, 0)` on every dropped piece. This is what makes the game feel arcade — orientation is set at spawn, physics only handles falling and stacking. This was the critical fix for playability.

**Piece types** (`constants.js`):
- `standard` — vertical tube, `physBox: [0.18, 1.8, 0.18]`, `getPieceHeight = height (1.8)`
- `ledger` — horizontal tube along X, `physBox: [2.6, 0.13, 0.13]`, `getPieceHeight = radius*2 (0.11)`
- `platform` — flat board, `physBox: [2.4, 0.22, 0.85]`, `getPieceHeight = size[1] (0.22)`

**Fell-off detection** — in `handleSettle`: `finalPos.y < stackTopY - 1.5` triggers game over. Works because pieces are rotation-locked so they can't end up in unexpected orientations.

**Restart pattern** — `gameKey` state in `App` increments on restart → `<GameScene key={gameKey}>` remounts → all cannon bodies clean up via `useEffect` return.

**Phase flow**: `'swinging'` → SPACE → `'falling'` → onSettle → `'swinging'` | `'gameover'`

**staleRef pattern** — `phaseRef` and `scoreRef` mirror their state equivalents so `keydown` handlers don't go stale between renders.

---

## What's next (pick one)

1. **Sound effects** — Web Audio API. Metal clang for standards/ledgers, wood thud for boards, boom for platform, collapse crash on game over. No external files needed.

2. **Leaderboard** — wire up FastAPI backend. POST score + initials on game over, GET top 10 on load. Backend already has Tortoise ORM + SQLite ready to go. Add a `Score` model and `/api/scores` router.

3. **Mobile / tap support** — `onPointerDown` on the Canvas to drop, touch controls. Currently keyboard-only.

4. **Difficulty curve improvements** — narrower pieces over time, swing speed acceleration, maybe wind that drifts the swing.

5. **Piece preview** — show the NEXT piece (not just the current one) so players can plan ahead.

6. **Visual polish pass** — fog, better sky gradient, construction site props (hard hats, warning cones) in the background, piece shadow sharpness.
