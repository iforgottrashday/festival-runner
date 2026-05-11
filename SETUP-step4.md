# SETUP — Step 4 (Cleanup + Crowd scaffold)

Two things this iteration:
1. The placeholder corridor visuals (pink wall, neon rails, lane stripes, perpendicular spur preview) are **hidden by default** — when Unity recompiles after pulling the latest code, those will disappear. The yellow chevron above each corner stays as the turn cue. Floor tiles stay as the road.
2. A new **`CrowdSpawner`** script can line both sides of the track with prefab instances. It does nothing until you give it prefabs.

## 1. Pull / let Unity recompile

When the Editor regains focus it'll re-import `TrackController.cs` (now with the new visibility flags) and pick up the new `CrowdSpawner.cs`. Wait for "Reloading…" in bottom-right to finish.

Press Play to verify the track now looks cleaner: just the dark floor + the player + a chevron above each corner. No more pink walls / neon rails / cyan stripes.

> Want any of the placeholder visuals back temporarily for debugging? Click **Track** in Hierarchy → in Inspector under **Track Controller (Script) → Placeholder visibility**, toggle the flags. They take effect when you press Play again.

## 2. Create the Crowd GameObject

1. In Hierarchy, right-click on **World** → **Create Empty**. Rename the new object to **Crowd**.
2. Set its Transform to Position `(0, 0, 0)`, Rotation `(0, 0, 0)`, Scale `(1, 1, 1)`.
3. With Crowd selected, **Add Component** → `CrowdSpawner`.

Default settings (you can tune these later):
- **Crowd Prefabs**: empty — that's why nothing spawns yet.
- **Spacing**: 3 — every 3 world units there's a crowd member.
- **Side Offset**: 4.5 — crowd lines up just outside the track edges (track is 7 wide).
- **Count Per Side**: 16 — 16 crowd members per side = ~48 world units of crowd visible.
- **Jitter**: 0.3 — small randomness so the line isn't perfectly mechanical.
- **Face Inward**: true — each crowd member faces the track center (looking at the runner).

Press Play — should look identical to before (because no crowd prefabs assigned yet, nothing renders). But the script's there waiting.

## 3. Get crowd prefabs (do this when convenient)

To populate the crowd, you need GameObjects in `Assets/` that can be assigned to the `Crowd Prefabs` array. Two sources:

### A. More Mixamo characters
1. Go to https://www.mixamo.com
2. Pick 4–6 different characters (e.g., **Erika Archer**, **Maw J Laygo**, **Granny**, **Lola B Styperek**, **Lewis**) — variety helps the crowd feel alive
3. For each: Download **FBX for Unity, with skin, T-pose**, save as `Assets/Mixamo/Crowd/[CharacterName].fbx`
4. Also grab 3–4 idle animations: **Idle**, **Cheering**, **Standing Greeting**, **Looking Around** — download **FBX for Unity, without skin** for each
5. In Unity: for each character FBX, set Rig → Humanoid → Apply
6. For each animation FBX, set Rig → Humanoid → Copy From Other Avatar → choose the corresponding character

### B. Build a Crowd prefab for each character
For each Mixamo character:
1. Drag the FBX into Hierarchy temporarily → it becomes a GameObject in the scene
2. Add an Animator Controller (or reuse a simple one with just one idle/cheer state) → assign it
3. Drag the GameObject from Hierarchy back into `Assets/Mixamo/Crowd/` to save as a **Prefab**
4. Delete the temporary GameObject from the scene

### C. Wire them into CrowdSpawner
1. Click the **Crowd** GameObject in Hierarchy
2. In Inspector → CrowdSpawner → expand **Crowd Prefabs** array
3. Set Size to your count (e.g., 4)
4. Drag each prefab from `Assets/Mixamo/Crowd/` into the array slots
5. Press Play — the crowd should now appear, lining both sides of the track, scrolling past as you run

## What to expect when crowd is wired

- Both sides of the track lined with crowd characters (mix of the prefabs you provided, randomly selected per spawn)
- Crowd scrolls toward the camera as you run — wraps to the rear when each member passes behind you
- During a turn, the crowd rotates 90° with the world (it's a child of World) — feels like you turned and there's still a crowd on the new corridor

## What's not done yet

- Festival decor: tents, stages, banners, art installations (next iteration)
- Themed obstacles: people standing in your path you have to dodge (next iteration)
- Audio: procedural house beat + crowd sounds (need to port the Web Audio synth)
- Floor / sky: still default dirt-grey + default Unity sky (need a festival ground texture and a stylized skybox)

We'll add these in subsequent passes. For now this commit gets the placeholder mess off the screen and gives you the spawner ready to receive crowd prefabs whenever you have them.
