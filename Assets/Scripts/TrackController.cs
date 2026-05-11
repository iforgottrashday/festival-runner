using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Looping floor tiles for the current corridor. Procedurally spawns
    /// <see cref="tileCount"/> tiles at uniform spacing in Start, then
    /// scrolls them toward the camera each frame. When a tile passes
    /// <see cref="wrapThresholdZ"/> it teleports to the back of the line.
    /// </summary>
    public class TrackController : MonoBehaviour
    {
        [Header("Tile layout")]
        [SerializeField] private int tileCount = 14;
        [SerializeField] private float tileLength = 8f;
        [SerializeField] private float laneStripeX = 1.1f;

        [Header("Wrap")]
        [Tooltip("Z position at which a tile teleports back to the rear.")]
        [SerializeField] private float wrapThresholdZ = 8f;

        [Header("Materials (optional)")]
        [Tooltip("Material applied to the tiles. Leave empty to use the default URP/Lit gray.")]
        [SerializeField] private Material tileMaterialEven;
        [SerializeField] private Material tileMaterialOdd;

        private Transform[] _tiles;

        void Start()
        {
            _tiles = new Transform[tileCount];
            for (int i = 0; i < tileCount; i++)
            {
                var tile = GameObject.CreatePrimitive(PrimitiveType.Cube);
                tile.name = $"Tile_{i}";
                tile.transform.SetParent(transform, worldPositionStays: false);
                tile.transform.localPosition = new Vector3(0f, -0.51f, -(i + 0.5f) * tileLength);
                tile.transform.localScale = new Vector3(7f, 1f, tileLength);

                // Tile colliders aren't useful for runner gameplay and just add overhead.
                var col = tile.GetComponent<Collider>();
                if (col != null) Destroy(col);

                var mat = (i % 2 == 0) ? tileMaterialEven : tileMaterialOdd;
                if (mat != null)
                {
                    var renderer = tile.GetComponent<Renderer>();
                    if (renderer != null) renderer.sharedMaterial = mat;
                }

                _tiles[i] = tile.transform;
            }
        }

        void Update()
        {
            var s = GameState.Instance;
            if (s == null || s.Status != GameStatus.Playing) return;

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
        }
    }
}
