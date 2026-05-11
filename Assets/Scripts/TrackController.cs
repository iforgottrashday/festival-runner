using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Renders the current corridor (looping floor tiles + side rails +
    /// lane stripes), the end-of-segment wall + chevron arrow, and a
    /// perpendicular branch preview that swings into view during a turn.
    ///
    /// Spawned procedurally in Start so the scene setup is just "attach
    /// this script to an empty Track GameObject under World."
    /// </summary>
    public class TrackController : MonoBehaviour
    {
        [Header("Tile layout")]
        [SerializeField] private int tileCount = 14;
        [SerializeField] private float tileLength = 8f;
        [SerializeField] private float trackWidth = 7f;

        [Header("Wrap")]
        [Tooltip("Z position at which a tile teleports back to the rear.")]
        [SerializeField] private float wrapThresholdZ = 8f;

        [Header("Preview spur")]
        [SerializeField] private int previewTileCount = 12;

        [Header("Wall")]
        [SerializeField] private float wallHeight = 1.4f;
        [SerializeField] private Vector3 wallTopTrimSize = new Vector3(7.2f, 0.12f, 0.4f);

        [Header("Colors")]
        [SerializeField] private Color tileEvenColor = new Color(0.10f, 0.04f, 0.20f);
        [SerializeField] private Color tileOddColor = new Color(0.05f, 0.02f, 0.13f);
        [SerializeField] private Color stripeColor = new Color(0f, 1f, 1f);
        [SerializeField] private Color railLeftColor = new Color(1f, 0f, 1f);
        [SerializeField] private Color railRightColor = new Color(0f, 1f, 1f);
        [SerializeField] private Color wallColor = new Color(1f, 0f, 0.67f);
        [SerializeField] private Color chevronColor = new Color(1f, 0.83f, 0f);

        private Transform[] _tiles;
        private Transform _wallGroup;
        private Transform _chevronGroup;
        private Transform _spurGroup;
        // Current corridor rails / stripes — kept as refs so we can resize
        // them each frame to end exactly at the wall.
        private Transform[] _currentStripes = new Transform[2];
        private Transform[] _currentRails = new Transform[2];
        private Transform[] _spurStripes = new Transform[2];
        private Transform[] _spurRails = new Transform[2];
        private int _lastTurnsCompletedSeen = -1;

        void Start()
        {
            // Pre-build materials (one each, instanced per object via .material on the renderer).
            var matEven = MakeColorMaterial(tileEvenColor);
            var matOdd = MakeColorMaterial(tileOddColor);
            var matStripe = MakeColorMaterial(stripeColor);
            var matRailLeft = MakeColorMaterial(railLeftColor);
            var matRailRight = MakeColorMaterial(railRightColor);
            var matWall = MakeColorMaterial(wallColor);
            var matChevron = MakeColorMaterial(chevronColor);
            var matWhite = MakeColorMaterial(Color.white);

            // ---- Current corridor floor tiles (scroll + wrap) ----
            _tiles = new Transform[tileCount];
            for (int i = 0; i < tileCount; i++)
            {
                var tile = MakeCube(
                    $"Tile_{i}",
                    new Vector3(0f, -0.51f, -(i + 0.5f) * tileLength),
                    new Vector3(trackWidth, 1f, tileLength),
                    i % 2 == 0 ? matEven : matOdd
                );
                _tiles[i] = tile.transform;
            }

            // Lane stripes + side rails for the current corridor.
            SpawnStripesAndRails(transform, matStripe, matRailLeft, matRailRight,
                                 _currentStripes, _currentRails);

            // ---- Wall + chevron at end of segment (moves with distAlong) ----
            _wallGroup = new GameObject("WallGroup").transform;
            _wallGroup.SetParent(transform, false);
            _wallGroup.gameObject.SetActive(false);

            MakeCube("Wall", new Vector3(0f, wallHeight / 2f, 0f),
                new Vector3(trackWidth, wallHeight, 0.3f), matWall, _wallGroup);
            MakeCube("WallTopTrim", new Vector3(0f, wallHeight + 0.05f, 0f),
                wallTopTrimSize, matWhite, _wallGroup);

            _chevronGroup = new GameObject("Chevron").transform;
            _chevronGroup.SetParent(_wallGroup, false);
            // Two boxes rotated 45° forming a ">" chevron pointing in local +X.
            MakeCube("ChevTop", new Vector3(0f, 0.75f, 0f),
                new Vector3(2.1f, 0.45f, 0.3f), matChevron, _chevronGroup,
                Quaternion.Euler(0f, 0f, -45f));
            MakeCube("ChevBot", new Vector3(0f, -0.75f, 0f),
                new Vector3(2.1f, 0.45f, 0.3f), matChevron, _chevronGroup,
                Quaternion.Euler(0f, 0f, 45f));
            _chevronGroup.localPosition = new Vector3(0f, wallHeight + 1.5f, 0f);

            // ---- Perpendicular spur preview ----
            _spurGroup = new GameObject("SpurPreview").transform;
            _spurGroup.SetParent(transform, false);
            _spurGroup.gameObject.SetActive(false);

            // Spur tiles use the SAME pattern as the current corridor so when
            // the rotation completes and segments shift, the geometry is at
            // matching scene-local positions — no visible snap.
            for (int i = 0; i < previewTileCount; i++)
            {
                MakeCube(
                    $"SpurTile_{i}",
                    new Vector3(0f, -0.51f, -(i + 0.5f) * tileLength),
                    new Vector3(trackWidth, 1f, tileLength),
                    i % 2 == 0 ? matEven : matOdd,
                    _spurGroup
                );
            }
            SpawnStripesAndRails(_spurGroup, matStripe, matRailLeft, matRailRight,
                                 _spurStripes, _spurRails);
        }

        void Update()
        {
            var s = GameState.Instance;
            if (s == null || s.Status != GameStatus.Playing)
            {
                if (_wallGroup != null) _wallGroup.gameObject.SetActive(false);
                if (_spurGroup != null) _spurGroup.gameObject.SetActive(false);
                return;
            }

            // Reset tile positions on each new segment so the post-snap geometry
            // matches where the spur tiles were just before snap.
            if (s.TurnsCompleted != _lastTurnsCompletedSeen)
            {
                _lastTurnsCompletedSeen = s.TurnsCompleted;
                for (int i = 0; i < _tiles.Length; i++)
                {
                    if (_tiles[i] == null) continue;
                    var p = _tiles[i].localPosition;
                    p.z = -(i + 0.5f) * tileLength;
                    _tiles[i].localPosition = p;
                }
            }

            // Scroll current corridor tiles forward (+Z, toward camera).
            float totalLen = tileCount * tileLength;
            float dz = s.Speed * Time.deltaTime;
            for (int i = 0; i < _tiles.Length; i++)
            {
                var t = _tiles[i];
                if (t == null) continue;
                Vector3 p = t.localPosition;
                p.z += dz;
                if (p.z > wrapThresholdZ) p.z -= totalLen;
                t.localPosition = p;
            }

            // Position wall at end of segment (cornerZ approaches 0 as player runs).
            var seg = PathManager.Instance?.Current;
            var nextSeg = PathManager.Instance?.Next;
            if (seg != null)
            {
                float cornerZ = -(seg.Length - s.DistAlong);

                // Resize current corridor's rails/stripes so they end exactly
                // at the wall (instead of extending past it into the spur).
                float currentVisible = seg.Length - s.DistAlong;
                FitToLength(_currentStripes, currentVisible);
                FitToLength(_currentRails, currentVisible);

                // Size the spur's rails/stripes to the next segment's length so
                // they match the new corridor's geometry the instant the snap
                // happens.
                if (nextSeg != null)
                {
                    FitToLength(_spurStripes, nextSeg.Length);
                    FitToLength(_spurRails, nextSeg.Length);
                }
                if (_wallGroup != null)
                {
                    _wallGroup.localPosition = new Vector3(0f, 0f, cornerZ);
                    _wallGroup.gameObject.SetActive(cornerZ < 4f);
                }
                if (_chevronGroup != null)
                {
                    // The chevron internally points +X. For a Right turn we want the
                    // tip pointing world -X (visually right); flip the group 180°.
                    // For a Left turn the chevron points world +X (visually left).
                    bool right = seg.TurnDir == TurnDir.Right;
                    _chevronGroup.localPosition = new Vector3(right ? -2.2f : 2.2f,
                                                              wallHeight + 1.5f, 0f);
                    _chevronGroup.localRotation = Quaternion.Euler(0f, right ? 180f : 0f, 0f);
                }
                if (_spurGroup != null)
                {
                    _spurGroup.localPosition = new Vector3(0f, 0f, cornerZ);
                    // Rotate so the spur's local -Z (its "forward") points in the
                    // turn direction in world space. Right turn → world -X.
                    _spurGroup.localRotation = Quaternion.Euler(0f,
                        seg.TurnDir == TurnDir.Right ? 90f : -90f, 0f);
                    _spurGroup.gameObject.SetActive(cornerZ < 4f);
                }
            }
        }

        void SpawnStripesAndRails(Transform parent, Material matStripe,
                                  Material matRailLeft, Material matRailRight,
                                  Transform[] stripesOut, Transform[] railsOut)
        {
            // Lane stripes — positions/scales overwritten each frame.
            int slot = 0;
            for (int sx = -1; sx <= 1; sx += 2)
            {
                var stripe = MakeCube(
                    $"Stripe_{sx}",
                    new Vector3(sx * 1.1f, 0f, 0f),
                    new Vector3(0.08f, 0.02f, 1f),
                    matStripe,
                    parent
                );
                stripesOut[slot++] = stripe.transform;
            }
            // Side rails — pink left, cyan right.
            slot = 0;
            for (int sx = -1; sx <= 1; sx += 2)
            {
                var rail = MakeCube(
                    $"Rail_{sx}",
                    new Vector3(sx * 3.5f, 0.5f, 0f),
                    new Vector3(0.15f, 1f, 1f),
                    sx < 0 ? matRailLeft : matRailRight,
                    parent
                );
                railsOut[slot++] = rail.transform;
            }
        }

        /// <summary>Resize/position a pair of rail or stripe transforms to span
        /// from local z=0 (player end) to local z=-length (corner end).</summary>
        static void FitToLength(Transform[] objects, float length)
        {
            if (length < 0f) length = 0f;
            float centerZ = -length / 2f;
            for (int i = 0; i < objects.Length; i++)
            {
                var t = objects[i];
                if (t == null) continue;
                var p = t.localPosition;
                p.z = centerZ;
                t.localPosition = p;
                var s = t.localScale;
                s.z = length;
                t.localScale = s;
            }
        }

        GameObject MakeCube(string name, Vector3 localPos, Vector3 scale,
                            Material mat, Transform parent = null,
                            Quaternion? localRot = null)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent != null ? parent : transform, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = localRot ?? Quaternion.identity;
            go.transform.localScale = scale;
            var col = go.GetComponent<Collider>();
            if (col != null) Destroy(col);
            var renderer = go.GetComponent<Renderer>();
            if (renderer != null && mat != null) renderer.sharedMaterial = mat;
            return go;
        }

        static Material MakeColorMaterial(Color color)
        {
            // URP/Lit is the standard shader in the URP template. Falls back
            // gracefully if a different render pipeline is in use.
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var m = new Material(shader);
            m.SetColor("_BaseColor", color);
            // Standard pipeline uses _Color:
            m.color = color;
            return m;
        }
    }
}
