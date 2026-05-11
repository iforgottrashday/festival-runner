# SETUP — Step 2 (Path + Walls + Turns)

Adds: procedural path generation, end-of-segment walls with chevron arrows, the turn mechanic (A/D in the last 14 units triggers a 90° turn), world rotation animation through the turn, and the perpendicular branch preview at each corner.

Do this after Step 1 is working (capsule running, lane switch, jump).

## 1. Pull the latest

The Unity Editor should auto-detect the new/changed scripts when it next gets focus. Wait for the "Reloading..." in the bottom-right to finish.

If the Console shows compile errors, screenshot and send them — that's the most likely thing to need fixing.

## 2. Add PathManager to the GameManager

1. In Hierarchy, click **GameManager**
2. In the Inspector, click **Add Component**
3. Type `PathManager` and add it

Leave all PathManager fields at their defaults (Min Length 55, Max Length 95, Initial Queue Size 4, Alternate Bias 0.7).

## 3. Create the World GameObject

The world (track + walls + spur) needs to rotate during turns. The Player and Camera stay outside it so they don't spin.

1. In Hierarchy, right-click empty space → **Create Empty**
2. Rename it **World**
3. Set its Transform to Position `(0, 0, 0)`, Rotation `(0, 0, 0)`, Scale `(1, 1, 1)`
4. With World selected, **Add Component** → `WorldRoot`

## 4. Reparent Track to World

The track is what rotates during turns. Move it under World.

1. In Hierarchy, drag **Track** onto **World**. It should become a child (indented under World).
2. After dropping, click Track and verify its Transform is still Position `(0, 0, 0)`, Rotation `(0, 0, 0)` (it should be — Unity preserves world position when reparenting).

⚠️ Do NOT reparent the Player. Player stays at the scene root — only the Track moves under World.

## 5. Press Play

Press Play, then **Space** to start.

What should happen:
- Tiles scroll toward you as before
- After ~5–8 seconds, a **pink wall** appears at the end of the segment with a **yellow chevron** above pointing either Left or Right
- Past the wall, you can see a **perpendicular corridor branching off** in the direction the chevron points
- When you're close to the wall (last ~14 units), press the matching direction (A for left, D for right) — the world rotates 90° and you continue running down the new corridor
- If you don't press in time, or press the wrong direction, you crash into the wall → Game Over screen (well, the state flips — there's no UI yet, just watch GameManager.GameState.Status in the Inspector flip to "GameOver")
- Press Space from GameOver to restart

## 6. Watch the state tick

With Play running, keep GameManager selected in the Hierarchy. In the Inspector you'll see live:
- **Path Manager → Segments**: the queue of upcoming segments (length + turn direction)
- **Game State → DistAlong**: climbs from 0 toward Segments[0].Length
- **Game State → IsTurning**: flips true when a turn fires, back to false at end
- **Game State → World Rotation**: animates 0 → ±90 during a turn
- **Game State → Turns Completed**: increments after each successful turn

## Known things that are intentionally not done yet

- No procedural music (Web Audio port pending)
- No obstacles in the corridor (next iteration)
- No HUD (score is in the GameState inspector for now)
- No trip-flash overlay during turns
- Materials are flat-color URP/Lit — neon emission + bloom + post-processing comes in a later pass

## Verification checklist

- [ ] Walls appear at the end of each segment with the right turn direction shown by the chevron
- [ ] Perpendicular spur is visible to one side of the wall, in the direction the chevron points
- [ ] Pressing A or D in the turn window (when close to wall) makes the world rotate 90°
- [ ] After the rotation, you're running down what was the spur — smooth continuity
- [ ] Pressing the wrong direction or doing nothing → crash into wall, status flips to GameOver
- [ ] Score gets +50 bonus per successful turn (visible in Inspector)

Tell me what feels right and what feels wrong. The directions and rotation signs are my best guess for Unity's left-handed quirks — if anything looks reversed or off, just describe what you see.
