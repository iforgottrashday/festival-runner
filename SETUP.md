# Festival Runner — Unity Setup

One-time scene assembly. Follow these steps in order in the Unity Editor.

## 1. Re-add the project to Unity Hub

We moved the Unity project from `C:\Users\notsh\Festival-Runner-Unity` to `C:\Users\notsh\festival-runner`, so Unity Hub no longer knows where it lives.

1. Open Unity Hub
2. The old `Festival-Runner-Unity` entry will say "Missing". Click the **three-dot menu** on that row → **Remove from list**.
3. Click **Add → Add project from disk**
4. Browse to `C:\Users\notsh\festival-runner` and select it
5. The project should appear in the list. Open it.

Unity will recompile (the new C# scripts have to be indexed) and re-import — first open after a move takes ~2-3 minutes. Wait until the bottom-right corner is idle.

## 2. Open the scene

In the Project window (lower-left panel), expand **Assets → Scenes**. Double-click **SampleScene** to open it.

You should see Main Camera, Directional Light, and Global Volume in the Hierarchy.

## 3. Position the camera (one-time)

We could do this manually, but the `CameraFollow` script does it for us. Just attach the script:

1. In Hierarchy, click **Main Camera**
2. In the Inspector, scroll to the bottom and click **Add Component**
3. Type `CameraFollow` and hit Enter to add the script

On Play (and even when the script's values change in the inspector at edit time), the camera will snap to position `(0, 4.5, 6.5)` looking at `(0, 1, -8)`. You'll see the framing immediately.

## 4. Create the GameManager

In Hierarchy, right-click empty space → **Create Empty**. Rename it to **GameManager**.

In the Inspector for GameManager:
1. Click **Add Component** → type `GameState` → add
2. Click **Add Component** → type `GameLoop` → add

Leave its Transform at `(0, 0, 0)`. This is a logic-only GameObject — it doesn't render anything.

## 5. Create the Player

In Hierarchy, right-click → **3D Object → Capsule**. Rename to **Player**.

Set its Transform in the Inspector:
- Position: `0, 0.5, 0`
- Scale: `0.8, 1, 0.8`

Add Component → `PlayerController`.

Optional: set its material to something pink/neon (we'll do real materials later).

## 6. Create the Track

In Hierarchy, right-click → **Create Empty**. Rename to **Track**. Set Transform to `(0, 0, 0)`.

Add Component → `TrackController`.

Don't worry about the `tileMaterialEven` / `tileMaterialOdd` fields — leave them empty for now. The tiles will use the default gray URP/Lit material. We'll wire neon materials in later.

## 7. Press Play

Hit the **Play** button at the top of the editor.

You should see:
- A row of gray cube tiles stretching ahead of the player
- The player capsule standing still
- Press **Space** or **Enter** — the game starts; tiles begin scrolling toward the camera
- Press **A**/**Left** or **D**/**Right** — player slides between lanes
- Press **Space** while running — player jumps

Speed ramps up as score climbs (visible in Hierarchy → click `GameManager` while playing to watch the GameState fields tick in the Inspector).

## Verification checklist

When working correctly:
- [ ] Cube tiles appear in a long row in front of the camera
- [ ] Player capsule visible above the tiles at center
- [ ] Pressing Space starts tile scrolling
- [ ] A/Left and D/Right move player between -2.2, 0, +2.2 X positions
- [ ] Space (during play) makes the player hop with a sine arc
- [ ] Score in GameState increases while playing

If any of these don't work, screenshot the Console window (Window → General → Console) and paste the errors and we'll debug.

## What's next

This is the bare runner — no path, no turns, no obstacles, no music, no neon visuals. From here we'll add:
1. Procedural path with discrete 90° turns (port the Web prototype's `PathManager` logic)
2. Wall + chevron marker at each corner
3. Perpendicular branch preview at the corner (the "you see the road bend ahead" cue)
4. World rotation during turns
5. Obstacle spawning + collision
6. HUD (score, high score, game-over overlay)
7. Procedural 128 BPM house beat (port `HouseBeat.ts`)
8. Neon materials + post-processing
9. Touch controls for mobile
10. iOS + Android build settings + signing

Each step is its own iteration — I'll write the C# and a `SETUP-stepN.md` for the Editor wiring.
