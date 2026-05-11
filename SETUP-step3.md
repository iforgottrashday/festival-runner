# SETUP — Step 3 (Mixamo character + animations)

Replaces the placeholder capsule with the Mixamo **Remy** character driven by an Animator that plays:

| Animation | When |
|---|---|
| House Dancing | Idle (waiting to start, or just landed back on idle after a game) |
| Running | While playing, on the ground |
| Jumping | When you press Space mid-run |
| Tripping | On game over |

Do this after Steps 1 and 2 are working.

## 1. Get the FBX files into Unity

1. In the Unity Project window (lower-left), navigate to `Assets`.
2. Right-click in the empty Assets area → **Create → Folder** → name it **`Mixamo`**.
3. In Windows Explorer, drag the 5 (or 6) FBX files (`Remy.fbx`, `House Dancing.fbx`, `Running.fbx`, `Jumping.fbx`, `Tripping.fbx`, optionally `Breathing Idle.fbx`) into the `Assets/Mixamo` folder in Unity's Project window.
4. Wait for Unity to import them (you'll see a progress bar bottom-right).

## 2. Configure Remy as a Humanoid character

This sets up Remy's skeleton so the animations can retarget to it.

1. Click **`Mixamo/Remy.fbx`** in the Project window.
2. In the Inspector, click the **Rig** tab.
3. **Animation Type:** change to **Humanoid**.
4. **Avatar Definition:** "Create From This Model" (default).
5. Click **Apply** at the bottom.

Wait a few seconds for Unity to generate Remy's Avatar (you'll see a `RemyAvatar` sub-asset appear when you expand `Remy.fbx` in the Project view).

## 3. Configure each animation to use Remy's Avatar

Repeat this for **each** of the animation FBX files (Running, Jumping, Tripping, House Dancing, Breathing Idle):

1. Click the animation .fbx in Project (e.g., `Running.fbx`).
2. Inspector → **Rig** tab:
   - **Animation Type:** Humanoid
   - **Avatar Definition:** **Copy From Other Avatar**
   - **Source:** click the little circle → search **"Remy"** → pick **`RemyAvatar`** (the sub-asset under Remy.fbx)
   - Click **Apply**.
3. Inspector → **Animation** tab:
   - For **Running**, **House Dancing**, **Breathing Idle**: check **Loop Time** ✅
   - For **Jumping**, **Tripping**: leave Loop Time unchecked
   - Click **Apply**.

## 4. Create the Animator Controller

1. In Project window, right-click in `Assets/Mixamo` → **Create → Animator Controller**.
2. Name it **`PlayerAnimator`**.
3. Double-click `PlayerAnimator` to open the Animator window.

You'll see an empty graph with **Entry**, **Exit**, and **Any State** nodes.

## 5. Add the animation states

For each animation, drag the **animation clip** (not the .fbx itself — expand the .fbx by clicking its arrow, then drag the clip with the play-arrow icon) from Project into the Animator graph:

1. Expand `Mixamo/House Dancing.fbx` → drag the clip (likely named `mixamo.com` — you can rename it after) into the Animator graph. It becomes a state.
2. Right-click that state → **Set as Layer Default State**. It'll turn orange.
3. Rename it to **Idle** (click the state, F2, or change Name in the Inspector).
4. Repeat for the other animations, naming the states:
   - Drag `Running.fbx`'s clip → name state **Running**
   - Drag `Jumping.fbx`'s clip → name state **Jumping**
   - Drag `Tripping.fbx`'s clip → name state **Tripping**

Don't worry about positioning the states visually — only the connections matter.

## 6. Add Animator parameters

In the Animator window, click the **Parameters** tab (left sidebar — there's "Layers" and "Parameters"; click Parameters).

Click the **+** and add:
- **Running** — **Bool** (defaults to false)
- **Jump** — **Trigger**
- **Trip** — **Trigger**

## 7. Wire up transitions

A "transition" is a directed arrow between two states. Right-click a state → **Make Transition** → click the target state.

Create these:

### Idle ↔ Running
- **Idle → Running**: condition `Running` (bool) == **true**, **uncheck Has Exit Time**.
- **Running → Idle**: condition `Running` == **false**, **uncheck Has Exit Time**.

### Jumping
- **Any State → Jumping**: condition `Jump` (trigger), **uncheck Has Exit Time**, **uncheck Can Transition To Self**.
- **Jumping → Running**: leave **Has Exit Time checked**, set **Exit Time = 0.9**, condition `Running` == **true**.
- **Jumping → Idle**: **Has Exit Time = 0.9**, condition `Running` == **false**.

### Tripping
- **Any State → Tripping**: condition `Trip` (trigger), **uncheck Has Exit Time**.
- **Tripping → Idle**: **Has Exit Time = 0.95** (lets the trip play almost fully before recovering).

> **How to set conditions and Exit Time:** click on the transition arrow itself. The Inspector shows the transition's settings: Has Exit Time checkbox at top, Exit Time below it, and Conditions at the bottom (click + to add a condition; pick the parameter and value).

Save (Ctrl+S) — the Animator Controller is now ready.

## 8. Drop Remy into the scene as the Player

1. Stop Play mode if running.
2. In Hierarchy, click the current **Player** GameObject → **delete it** (Delete key).
3. From Project, drag **`Mixamo/Remy.fbx`** into the Hierarchy. It becomes a `Remy` GameObject. Set its Transform to:
   - Position: `0, 0, 0`
   - Rotation: `0, 180, 0` ⚠️ (Mixamo characters face +Z; our camera looks at -Z so we need the character to face -Z = the player's run direction. **If Remy ends up facing AWAY from the camera in Play mode, change this to `0, 0, 0` instead.**)
   - Scale: `1, 1, 1`
4. Rename `Remy` to **`Player`**.
5. With Player selected, click **Add Component** → `PlayerController`.
6. Look at the PlayerController in the Inspector:
   - **Base Y** should already be set to `0` from the script default — if not, set it to **0**.
   - **Animator**: there's a new field. Click the little circle to the right of the field → in the popup, type "Player" → pick the **Animator** component on this Player GameObject (the one auto-added by Unity from the FBX humanoid import).
   - **Jump Height**: lower to **1.2** (1.8 is too high for a real character).

## 9. Assign the Animator Controller

1. With Player selected in Hierarchy, look at the **Animator** component in the Inspector (it was auto-added).
2. The **Controller** field will be empty. Click the circle to its right → pick **`PlayerAnimator`** (the one we created in step 4).
3. **Avatar** should already be auto-set to `RemyAvatar`. Leave it.
4. Make sure **Apply Root Motion** is **unchecked** (we drive position from the PlayerController script, not from the animation's root motion).

## 10. Press Play

1. Hit Play.
2. Before pressing Space, Remy should be standing at the center of the track, **dancing** (the House Dancing idle animation).
3. Press Space — game starts, Remy switches to the Running animation, tiles scroll past.
4. Press Space again mid-run — Remy plays the Jumping animation, then returns to Running.
5. Crash into a wall or fail a turn — Remy plays the Tripping animation. Then he returns to Idle (dancing).
6. Press Space to restart.

## Troubleshooting

- **Remy is just standing in T-pose, no animation:** the Animator Controller isn't assigned to the Animator component on Player. Go back to step 9.
- **Remy is running but slides instead of animating his legs:** Animator Controller is fine but animations aren't transitioning. Go back to the Animator window, verify the parameters are named exactly **Running**, **Jump**, **Trip** (case-sensitive), and the transitions have the right conditions.
- **Remy is facing away from the camera (you see his back):** flip the Player's Rotation Y between 0 and 180 in the Inspector.
- **Remy is sinking into the floor:** PlayerController's Base Y is wrong — set it to **0** in the Inspector.
- **Animations play but in the wrong order (e.g., Tripping plays during a run):** transition conditions are wrong. Check that "Any State → Tripping" only triggers on the `Trip` trigger, and "Any State → Jumping" only on `Jump`.

When it works, tell me:
- Is the running animation playing correctly?
- Does the Idle dance vibe show when you're not playing?
- Does Tripping play on game over?
- Any visual jankiness (e.g., feet sliding, weird arm motion)?
