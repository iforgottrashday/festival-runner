# SETUP — Step 5 (Festival decor along the path)

Adds 10 Sketchfab .glb props (tents, trucks, trailers, DJ deck, etc.) procedurally placed along both sides of the track via a new `DecorSpawner` script. You can have **multiple DecorSpawner instances** in the scene — one per class of decor — each with different spacing, side offsets, prefabs, and facing modes.

Do this once. After you finish, every run will scroll past tents, trucks, barricades, bunting, etc.

## 1. Clean up any test props in the scene

If you've dragged props (porta_potty, dj_deck_simple) into the scene as test instances, **delete them now** from the Hierarchy. The DecorSpawner will instantiate them at runtime — leaving the test instances would cause duplicates.

## 2. Create the "Decor" parent GameObject

1. In Hierarchy, right-click **World** → **Create Empty**
2. Rename it **`Decor`**
3. Set Transform to Position `(0, 0, 0)`, Rotation `(0, 0, 0)`, Scale `(1, 1, 1)`

This will be the parent for all the DecorSpawner GameObjects. Multiple spawners under one parent keep the scene organized.

## 3. Add a DecorSpawner for each class of decor

Repeat this pattern for each class below:

**Pattern:**
1. Right-click **Decor** → **Create Empty** → name it `DecorSpawner_TYPE`
2. Add Component → **DecorSpawner**
3. Configure inspector fields (see tables below)
4. Drag the matching .glb files into the **Prefabs** array

### 3a. Porta Potties + Picnic Tables (scattered low-frequency)

- **Name:** `DecorSpawner_PortaPotties`
- **Prefabs:** `porta_potty.glb`, `picnic_table_-_low_poly.glb`
- **Spacing:** 18
- **Side Offset:** 6
- **Count Per Side:** 8
- **Side Mode:** Both
- **Y Offset:** 0
- **Jitter X:** 0.6, **Jitter Z:** 3
- **Facing Mode:** FaceInward
- **Scale Min/Max:** 1 / 1

### 3b. Tents (scattered medium-frequency)

- **Name:** `DecorSpawner_Tents`
- **Prefabs:** `tent_canopy_-_rectangular.glb`
- **Spacing:** 24
- **Side Offset:** 7
- **Count Per Side:** 8
- **Side Mode:** Both
- **Y Offset:** 0
- **Jitter X:** 0.5, **Jitter Z:** 4
- **Facing Mode:** FaceInward
- **Scale:** 1 / 1.2 (slight size variety)

### 3c. Food Trucks + Ice Cream Trucks (rare landmarks)

- **Name:** `DecorSpawner_FoodTrucks`
- **Prefabs:** `food_truck_textured.glb`, `ice_cream_truck.glb`
- **Spacing:** 50
- **Side Offset:** 8
- **Count Per Side:** 4
- **Side Mode:** Both
- **Jitter X:** 0.3, **Jitter Z:** 5
- **Facing Mode:** FaceInward
- **Scale:** 1 / 1

### 3d. Semi-Trailers (backstage row, lengthwise along the path)

- **Name:** `DecorSpawner_Trailers`
- **Prefabs:** `semi_trailer.glb`
- **Spacing:** 18 (close — they're parked nose-to-tail)
- **Side Offset:** 10 (further out, behind everything else)
- **Count Per Side:** 6
- **Side Mode:** Both
- **Jitter X:** 0.2, **Jitter Z:** 0.5 (mostly aligned)
- **Facing Mode:** Lengthwise
- **Y Rotation Offset:** 90 (semi_trailer might import facing perpendicular to track — if so, this rotates it so it's lengthwise; if trailers come out wrong, change to 0 or 180 or 270)

### 3e. Barricades (densely along the inner edge of the path)

- **Name:** `DecorSpawner_Barricades`
- **Prefabs:** `barikade_hitam_panjang_4_meter_31.glb`
- **Spacing:** 4 (close together to form a continuous line)
- **Side Offset:** 4 (just outside the lane area, between path and crowd)
- **Count Per Side:** 30
- **Side Mode:** Both
- **Jitter X:** 0, **Jitter Z:** 0 (no jitter — clean line)
- **Facing Mode:** Lengthwise
- **Y Rotation Offset:** 90 (likely needs adjustment based on model orientation)

### 3f. Bunting Banners (overhead, strung high)

- **Name:** `DecorSpawner_Bunting`
- **Prefabs:** `colorful_festival_bunting_banner.glb`
- **Spacing:** 12
- **Side Offset:** 0 (centered overhead, not on sides)
- **Count Per Side:** 8
- **Side Mode:** LeftOnly (so it only spawns one row instead of two)
- **Y Offset:** 5 (raised up overhead)
- **Jitter X:** 0, **Jitter Z:** 1
- **Facing Mode:** Lengthwise

### 3g. DJ Deck (one centerpiece, optional for now)

For now, skip this in DecorSpawner — it's a landmark, not scattered decor. We'll write a separate "centerpiece at start" later.

### 3h. Multi-Cam (rare vantage prop)

- **Name:** `DecorSpawner_Cameras`
- **Prefabs:** `multy_cam_n_level_1_module_t_1meter.glb`
- **Spacing:** 60
- **Side Offset:** 5.5
- **Count Per Side:** 3
- **Side Mode:** Both
- **Facing Mode:** FaceInward

## 4. Press Play

You should see:
- Crowd (from earlier) lining the sides at ~4.5 offset
- Tents, porta potties, picnic tables further out at ~6–7 offset
- Food trucks and barricades at varying offsets
- Bunting strung overhead
- Semi-trailers in a row at the outer edge
- All scrolling toward you as you run, wrapping around as you go

## 5. Tuning

Once you see them in-game, you'll probably want to tweak. Common adjustments:

- **Props sunk into the ground**: bump up Y Offset on that spawner (e.g., from 0 to 0.5)
- **Props floating in the air**: lower Y Offset
- **Props facing the wrong way**: adjust Y Rotation Offset by 90° at a time (try 0, 90, 180, 270)
- **Too dense / too sparse**: adjust Spacing
- **Bunching at the same spot**: bump Jitter Z
- **Performance issues** (frame rate drops): reduce Count Per Side on the heaviest spawners

## What's not done yet

- **DJ deck centerpiece at segment start** (we'll do this as a special segment-aware spawner)
- **The cam-on-stand at stage areas** (depends on stage centerpiece)
- **Themed obstacles** (people in your path you have to dodge)
- **Festival ground/sky** (still default URP grid + skybox)
- **Audio**
- **Tickets gate at the very start** (need a custom-built or sourced model)
