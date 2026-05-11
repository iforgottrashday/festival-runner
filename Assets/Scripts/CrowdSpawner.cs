using System.Collections.Generic;
using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Spawns prefab instances along both sides of the track at uniform
    /// spacing — the festival crowd lining the corridor. Scrolls them
    /// toward the camera each frame and wraps them back to the rear when
    /// they pass behind the player, same pattern as the floor tiles.
    ///
    /// Asset-agnostic: works with whatever GameObject prefabs you assign
    /// to <see cref="crowdPrefabs"/>. Today that's Mixamo characters in
    /// idle/dance animations; tomorrow it can be a Synty crowd pack or
    /// anything else — only the prefab reference changes.
    ///
    /// Attach to an empty "Crowd" GameObject under World (so the crowd
    /// rotates with the world during turns, same as the track tiles).
    /// </summary>
    public class CrowdSpawner : MonoBehaviour
    {
        [Header("Crowd Prefabs")]
        [Tooltip("Pool of crowd prefabs to randomly choose from for each instance. " +
                 "Empty array = no crowd spawned (the script just sits idle).")]
        [SerializeField] private GameObject[] crowdPrefabs;

        [Header("Placement")]
        [Tooltip("Distance between adjacent crowd members along the track.")]
        [SerializeField] private float spacing = 3f;

        [Tooltip("Distance from track center to the row of crowd, in world X units. " +
                 "Default 4.5 keeps them just outside a 7-unit-wide track.")]
        [SerializeField] private float sideOffset = 4.5f;

        [Tooltip("How many crowd members per side. Each side spawns this many; total = 2x.")]
        [SerializeField] private int countPerSide = 16;

        [Tooltip("Small random jitter applied to each crowd member's position so the line doesn't look perfectly mechanical.")]
        [SerializeField] private float jitter = 0.3f;

        [Header("Facing")]
        [Tooltip("If true, each crowd member is rotated to face the track center. If false, they all face the same direction as the runner (forward).")]
        [SerializeField] private bool faceInward = true;

        [Header("Wrap")]
        [Tooltip("Z position at which a crowd member teleports back to the rear of the line. Should be slightly behind the camera.")]
        [SerializeField] private float wrapThresholdZ = 8f;

        private readonly List<Transform> _crowd = new List<Transform>();

        void Start()
        {
            if (crowdPrefabs == null || crowdPrefabs.Length == 0) return;

            // Total covered length = spacing * countPerSide. After wrapping,
            // each member cycles through this range.
            for (int sideIndex = 0; sideIndex < 2; sideIndex++)
            {
                // Side 0 = world +X (camera-left in Unity's left-handed setup),
                // side 1 = world -X (camera-right).
                float sideX = sideIndex == 0 ? sideOffset : -sideOffset;

                for (int i = 0; i < countPerSide; i++)
                {
                    var prefab = crowdPrefabs[Random.Range(0, crowdPrefabs.Length)];
                    var instance = Instantiate(prefab, transform);
                    instance.name = $"Crowd_{(sideIndex == 0 ? "L" : "R")}_{i}";

                    float xJitter = Random.Range(-jitter, jitter);
                    float zJitter = Random.Range(-jitter, jitter);
                    instance.transform.localPosition = new Vector3(
                        sideX + xJitter,
                        0f,
                        -(i + 0.5f) * spacing + zJitter
                    );

                    if (faceInward)
                    {
                        // Side at +X faces -X direction (toward center).
                        // Side at -X faces +X.
                        var forward = sideX > 0 ? Vector3.left : Vector3.right;
                        instance.transform.localRotation = Quaternion.LookRotation(forward, Vector3.up);
                    }
                    else
                    {
                        // Face same direction as player (180° around Y to match camera).
                        instance.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
                    }

                    _crowd.Add(instance.transform);
                }
            }
        }

        void Update()
        {
            var s = GameState.Instance;
            if (s == null || s.Status != GameStatus.Playing) return;
            if (_crowd.Count == 0) return;

            float totalLen = countPerSide * spacing;
            float dz = s.Speed * Time.deltaTime;

            for (int i = 0; i < _crowd.Count; i++)
            {
                var t = _crowd[i];
                if (t == null) continue;
                var p = t.localPosition;
                p.z += dz;
                if (p.z > wrapThresholdZ) p.z -= totalLen;
                t.localPosition = p;
            }
        }
    }
}
