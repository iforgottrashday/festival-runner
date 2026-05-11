# SETUP — Step 6 (Obstacles)

Adds dodge-or-jump obstacles in your lanes during gameplay. Until now, the seconds between corners had nothing to do; now you have to either lane-switch around tall blocks or jump short ones.

## 1. Create the Obstacles GameObject

1. In Hierarchy, right-click on **World** → **Create Empty**
2. Rename to **`Obstacles`**
3. Set Transform: Position `(0, 0, 0)`, Rotation `(0, 0, 0)`, Scale `(1, 1, 1)`
4. With Obstacles selected, click **Add Component** → type `ObstacleSpawner` → add

## 2. (Optional) Configure inspector

Default values are tuned for reasonable challenge. If you want to mess with them:

| Field | Default | What it does |
|---|---|---|
| Pool Size | 16 | Total obstacle instances. More = denser when speed is high. |
| Spawn Z | -50 | How far ahead the obstacle appears when it spawns. |
| Kill Z | 8 | When obstacle passes this Z, it recycles. |
| Min Gap Z | 14 | Minimum Z distance between adjacent obstacles. Lower = denser. |
| Turn Clearance | 22 | Stop spawning when this close to the corner (clean lanes for the turn). |
| Jumpable Probability | 0.3 | Fraction of obstacles that are short (jumpable). Rest are blocks (must dodge). |
| Lane Width | 2.2 | Must match PlayerController's laneWidth (don't change unless you change both). |
| Collision Radius X | 0.7 | Horizontal hit box. |
| Jump Clearance Y | 0.55 | Player must have jumped at least this high to clear a jumpable. |

## 3. Press Play

Without any prefabs assigned, the script falls back to primitive cubes:
- **Tall pink cubes** = blocks (must switch lanes to avoid)
- **Short yellow cubes** = jumpable (press Space to clear)

You'll see them spawn in front, slide toward you, and you have to dodge or jump. Hit one → game over → Tripping animation plays → press Space to restart.

## 4. (Later, when you want better visuals)

Swap the primitive cubes for actual prefabs:

- **Block Prefabs**: assign humanoid Mixamo prefabs (one of your crowd characters standing still) — reads as "drunk festival-goer in your way"
- **Jumpable Prefabs**: assign short props like `picnic_table_-_low_poly.glb` or a porta_potty laid down — things you'd realistically have to hop over

When you assign prefabs, the script uses those instead of the primitives. Same workflow as DecorSpawner.

## Tuning notes

Too easy?
- Lower **Min Gap Z** to 10 → denser obstacles
- Lower **Turn Clearance** to 12 → less rest time before turns
- Raise **Jumpable Probability** to 0.5 → more variety

Too hard?
- Raise **Min Gap Z** to 20
- Lower **Jumpable Probability** to 0.15 (lane-switches are more reliable than jumps)

## What's NOT in this iteration

- **Themed obstacle visuals** (people in path, festival props as obstacles) — easy upgrade once you decide what they should look like
- **Power-ups / collectibles** (boost, slow-mo, magnet) — a separate spawner system
- **Difficulty ramp** — currently constant; could scale frequency with score
