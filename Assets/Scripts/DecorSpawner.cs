using System.Collections.Generic;
using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// More flexible cousin of CrowdSpawner — places decor prefabs (tents,
    /// trucks, trailers, banners, etc.) along the track. Each
    /// DecorSpawner GameObject is configured for ONE class of decor
    /// (e.g., one for porta_potties/picnic_tables, one for tents, one for
    /// semi-trailers lined up lengthwise, etc.). Attach multiple to a
    /// "Decor" empty under World.
    /// </summary>
    public class DecorSpawner : MonoBehaviour
    {
        public enum SideMode { Both, LeftOnly, RightOnly }
        public enum FacingMode
        {
            /// <summary>Default. Face the track center (good for tents, trucks viewed from the side).</summary>
            FaceInward,
            /// <summary>Face the player's running direction (good for things on the path).</summary>
            FaceForward,
            /// <summary>Same as FaceForward but for "long" props (semi_trailer) lined up parallel to the path.</summary>
            Lengthwise,
            /// <summary>Random rotation around Y. Good for scattered scenery (banners, art installations).</summary>
            Random,
        }

        [Header("Prefabs")]
        [Tooltip("Pool of decor prefabs to randomly choose from for each instance. " +
                 "Empty array = no decor spawned (the script just sits idle).")]
        [SerializeField] private GameObject[] prefabs;

        [Header("Placement")]
        [Tooltip("Distance between adjacent decor items along the track.")]
        [SerializeField] private float spacing = 10f;

        [Tooltip("Distance from track center to each side, in world X units.")]
        [SerializeField] private float sideOffset = 5f;

        [Tooltip("How many decor items per side. If SideMode is single-side, only this side spawns.")]
        [SerializeField] private int countPerSide = 10;

        [SerializeField] private SideMode sideMode = SideMode.Both;

        [Tooltip("Y offset applied to every item (e.g., -0.5 to sink slightly into the ground, 4 to hang banners overhead).")]
        [SerializeField] private float yOffset = 0f;

        [Tooltip("Random offset on X (perpendicular to track) added per instance.")]
        [SerializeField] private float jitterX = 0.4f;

        [Tooltip("Random offset on Z (along track) added per instance.")]
        [SerializeField] private float jitterZ = 1.5f;

        [Header("Facing")]
        [SerializeField] private FacingMode facingMode = FacingMode.FaceInward;

        [Tooltip("Add this to each item's Y rotation (degrees). Useful when a model imports facing the wrong way.")]
        [SerializeField] private float yRotationOffset = 0f;

        [Header("Scale")]
        [Tooltip("Minimum scale multiplier. Set min=max=1 to disable per-item scaling.")]
        [SerializeField] private float scaleMin = 1f;
        [SerializeField] private float scaleMax = 1f;

        [Header("Wrap")]
        [Tooltip("Z position at which an item teleports back to the rear of the line.")]
        [SerializeField] private float wrapThresholdZ = 8f;

        private readonly List<Transform> _items = new List<Transform>();

        void Start()
        {
            if (prefabs == null || prefabs.Length == 0) return;

            int sidesToFill = sideMode == SideMode.Both ? 2 : 1;
            for (int s = 0; s < sidesToFill; s++)
            {
                float sideX;
                bool isLeftSide;
                if (sideMode == SideMode.LeftOnly)
                {
                    sideX = sideOffset; // world +X = camera-left in Unity's setup
                    isLeftSide = true;
                }
                else if (sideMode == SideMode.RightOnly)
                {
                    sideX = -sideOffset;
                    isLeftSide = false;
                }
                else
                {
                    // Both — alternate sides
                    sideX = s == 0 ? sideOffset : -sideOffset;
                    isLeftSide = s == 0;
                }

                for (int i = 0; i < countPerSide; i++)
                {
                    var prefab = prefabs[Random.Range(0, prefabs.Length)];
                    var instance = Instantiate(prefab, transform);
                    instance.name = $"Decor_{(isLeftSide ? "L" : "R")}_{i}_{prefab.name}";

                    float jx = Random.Range(-jitterX, jitterX);
                    float jz = Random.Range(-jitterZ, jitterZ);
                    instance.transform.localPosition = new Vector3(
                        sideX + jx,
                        yOffset,
                        -(i + 0.5f) * spacing + jz
                    );

                    instance.transform.localRotation = ComputeRotation(isLeftSide);

                    if (!Mathf.Approximately(scaleMin, scaleMax))
                    {
                        float sc = Random.Range(scaleMin, scaleMax);
                        instance.transform.localScale = Vector3.one * sc;
                    }

                    _items.Add(instance.transform);
                }
            }
        }

        Quaternion ComputeRotation(bool isLeftSide)
        {
            float baseY = facingMode switch
            {
                FacingMode.FaceInward =>
                    // Face from this side toward the track center.
                    // Left side (sideX > 0) faces -X → 90° Y rotation.
                    // Right side faces +X → -90° Y rotation.
                    isLeftSide ? 90f : -90f,
                FacingMode.FaceForward =>
                    // Match the player's run direction (facing camera = 180°).
                    180f,
                FacingMode.Lengthwise =>
                    // Align with the path tangent. Same as FaceForward really,
                    // but the intent is "the prop is long along Z" so it lines
                    // up nose-to-tail. Add yRotationOffset to nudge if a model
                    // was modeled facing the wrong way.
                    0f,
                FacingMode.Random => Random.Range(0f, 360f),
                _ => 0f,
            };
            return Quaternion.Euler(0f, baseY + yRotationOffset, 0f);
        }

        void Update()
        {
            var s = GameState.Instance;
            if (s == null || s.Status != GameStatus.Playing) return;
            if (_items.Count == 0) return;

            float totalLen = countPerSide * spacing;
            float dz = s.Speed * Time.deltaTime;

            for (int i = 0; i < _items.Count; i++)
            {
                var t = _items[i];
                if (t == null) continue;
                var p = t.localPosition;
                p.z += dz;
                if (p.z > wrapThresholdZ) p.z -= totalLen;
                t.localPosition = p;
            }
        }
    }
}
