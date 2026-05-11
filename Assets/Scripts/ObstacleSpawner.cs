using System.Collections.Generic;
using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Spawns obstacles in the player's lanes that they have to dodge
    /// (by switching lanes) or jump over. Without this, the gameplay
    /// between corners is empty — you just run forward and wait for the
    /// next turn. Obstacles give every second of running purpose.
    ///
    /// Pool-based: pre-allocates a fixed pool of obstacle instances and
    /// recycles them. Each frame they slide toward the player at
    /// GameState.Speed * dt; once they pass the player they're recycled.
    /// New ones spawn at the rear when there's room (every minGapZ).
    ///
    /// Two obstacle classes:
    /// - <b>Block</b>: full-height, can't be jumped. Player must switch lanes.
    /// - <b>Jumpable</b>: shorter, can be cleared by jumping (CurrentJumpY > clearanceY).
    ///
    /// If prefab arrays are empty, falls back to primitive cubes so the
    /// spawner is testable out of the box.
    ///
    /// Attach to an empty "Obstacles" GameObject under World.
    /// </summary>
    public class ObstacleSpawner : MonoBehaviour
    {
        [Header("Prefabs (optional — primitives used if empty)")]
        [Tooltip("Block-type obstacles. Player MUST switch lanes — cannot jump over.")]
        [SerializeField] private GameObject[] blockPrefabs;

        [Tooltip("Jumpable obstacles. Player can clear them with a jump.")]
        [SerializeField] private GameObject[] jumpablePrefabs;

        [Header("Pool")]
        [SerializeField] private int poolSize = 16;

        [Header("Spawn")]
        [Tooltip("Z position where a new obstacle is placed when spawned. Negative = ahead of player.")]
        [SerializeField] private float spawnZ = -50f;

        [Tooltip("Z position past which an obstacle is recycled (behind the camera).")]
        [SerializeField] private float killZ = 8f;

        [Tooltip("Minimum gap between adjacent obstacles in the queue.")]
        [SerializeField] private float minGapZ = 14f;

        [Tooltip("If the player is within this many units of the corner, stop spawning new obstacles — give the player clean lanes to focus on the turn.")]
        [SerializeField] private float turnClearance = 22f;

        [Tooltip("Probability that a spawned obstacle is jumpable (vs block). 0 = always block, 1 = always jumpable.")]
        [Range(0f, 1f)]
        [SerializeField] private float jumpableProbability = 0.3f;

        [Header("Lane mapping")]
        [Tooltip("World units between adjacent lanes. Must match PlayerController.laneWidth.")]
        [SerializeField] private float laneWidth = 2.2f;

        [Header("Collision")]
        [Tooltip("Horizontal hit radius — if player.x and obstacle.x are within this distance, it's a hit.")]
        [SerializeField] private float collisionRadiusX = 0.7f;

        [Tooltip("Z-zone around the player where collision is checked.")]
        [SerializeField] private float collisionZMin = -0.7f;
        [SerializeField] private float collisionZMax = 0.7f;

        [Tooltip("Jumpable obstacles are cleared if CurrentJumpY exceeds this. Tune based on jumpHeight.")]
        [SerializeField] private float jumpClearanceY = 0.55f;

        [Header("Visual (primitive fallback only)")]
        [SerializeField] private Color blockColor = new Color(1f, 0.20f, 0.85f);
        [SerializeField] private Color jumpableColor = new Color(1f, 0.85f, 0.10f);
        [SerializeField] private float blockHeight = 1.6f;
        [SerializeField] private float jumpableHeight = 0.55f;
        [SerializeField] private float obstacleWidth = 1.0f;

        private enum ObstacleType { Block, Jumpable }

        private class Obstacle
        {
            public Transform transform;
            public ObstacleType type;
            public int lane; // -1, 0, 1
            public bool active;
            public bool scored;
        }

        private readonly List<Obstacle> _pool = new List<Obstacle>();
        private int _lastTurnsCompletedSeen = -1;
        private int _lastStatusSeen = -1;

        void Start()
        {
            for (int i = 0; i < poolSize; i++)
            {
                var ob = new Obstacle { active = false };
                _pool.Add(ob);
            }
        }

        void Update()
        {
            var s = GameState.Instance;
            var player = PlayerController.Instance;
            if (s == null || player == null) return;

            int statusInt = (int)s.Status;

            // Reset pool on each new run AND each segment transition — stale
            // obstacles from a previous segment would otherwise collide instantly.
            if (statusInt != _lastStatusSeen || s.TurnsCompleted != _lastTurnsCompletedSeen)
            {
                if (s.Status == GameStatus.Playing &&
                    (_lastStatusSeen != statusInt || s.TurnsCompleted != _lastTurnsCompletedSeen))
                {
                    DeactivateAll();
                }
                _lastStatusSeen = statusInt;
                _lastTurnsCompletedSeen = s.TurnsCompleted;
            }

            if (s.Status != GameStatus.Playing || s.IsTurning)
            {
                // Hide everything when not actively running through a segment.
                foreach (var ob in _pool)
                {
                    if (ob.transform != null) ob.transform.gameObject.SetActive(false);
                }
                return;
            }

            float dz = s.Speed * Time.deltaTime;
            float playerX = player.CurrentX;
            float playerJumpY = player.CurrentJumpY;
            float furthestZ = 0f;

            // Advance + collision check.
            for (int i = 0; i < _pool.Count; i++)
            {
                var ob = _pool[i];
                if (!ob.active || ob.transform == null) continue;

                var p = ob.transform.localPosition;
                p.z += dz;
                ob.transform.localPosition = p;

                if (p.z < furthestZ) furthestZ = p.z;

                // Collision window — only check when obstacle is roughly at the player's z.
                if (p.z > collisionZMin && p.z < collisionZMax)
                {
                    float obstacleX = ob.lane * -laneWidth; // negated to match PlayerController convention
                    float dx = Mathf.Abs(playerX - obstacleX);
                    bool jumpClears = ob.type == ObstacleType.Jumpable && playerJumpY > jumpClearanceY;
                    if (dx < collisionRadiusX && !jumpClears)
                    {
                        s.EndGame();
                        return;
                    }
                }

                // Score when passed (small reward for surviving each obstacle).
                if (!ob.scored && p.z > 1.5f)
                {
                    ob.scored = true;
                    s.Score += 10;
                }

                // Recycle when off-screen behind player.
                if (p.z > killZ)
                {
                    ob.active = false;
                    ob.transform.gameObject.SetActive(false);
                }
            }

            // Stop spawning near the corner — give clean lanes to react to the turn cue.
            var seg = PathManager.Instance?.Current;
            float distToWall = seg != null ? seg.Length - s.DistAlong : float.PositiveInfinity;
            bool spawnAllowed = distToWall > turnClearance;

            if (spawnAllowed && furthestZ > spawnZ + minGapZ)
            {
                SpawnOne();
            }
        }

        void DeactivateAll()
        {
            foreach (var ob in _pool)
            {
                ob.active = false;
                ob.scored = false;
                if (ob.transform != null) ob.transform.gameObject.SetActive(false);
            }
        }

        void SpawnOne()
        {
            // Find a free slot in the pool.
            Obstacle slot = null;
            for (int i = 0; i < _pool.Count; i++)
            {
                if (!_pool[i].active) { slot = _pool[i]; break; }
            }
            if (slot == null) return;

            // Pick type + prefab.
            bool isJumpable = Random.value < jumpableProbability;
            var type = isJumpable ? ObstacleType.Jumpable : ObstacleType.Block;
            var prefabs = isJumpable ? jumpablePrefabs : blockPrefabs;
            int lane = Random.Range(-1, 2); // -1, 0, 1

            // If we don't have a transform yet, create one (lazy init or primitive fallback).
            if (slot.transform == null)
            {
                GameObject go;
                if (prefabs != null && prefabs.Length > 0)
                {
                    go = Instantiate(prefabs[Random.Range(0, prefabs.Length)], transform);
                }
                else
                {
                    go = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    go.transform.SetParent(transform, false);
                    float h = isJumpable ? jumpableHeight : blockHeight;
                    go.transform.localScale = new Vector3(obstacleWidth, h, obstacleWidth);
                    var col = go.GetComponent<Collider>();
                    if (col != null) Destroy(col);
                    var renderer = go.GetComponent<Renderer>();
                    if (renderer != null)
                    {
                        var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
                        var mat = new Material(shader);
                        mat.SetColor("_BaseColor", isJumpable ? jumpableColor : blockColor);
                        mat.color = isJumpable ? jumpableColor : blockColor;
                        renderer.sharedMaterial = mat;
                    }
                }
                slot.transform = go.transform;
            }
            else
            {
                slot.transform.gameObject.SetActive(true);
            }

            slot.type = type;
            slot.lane = lane;
            slot.active = true;
            slot.scored = false;

            // Position at the rear, in the chosen lane. Prefabs are assumed to
            // have their pivot at the feet (typical for humanoid models like
            // Mixamo characters), so Y=0 places them on the ground. Primitive
            // fallback cubes pivot at the center, so we offset by half height.
            bool usingPrefab = prefabs != null && prefabs.Length > 0;
            float y = usingPrefab ? 0f
                                  : (isJumpable ? jumpableHeight / 2f : blockHeight / 2f);
            slot.transform.localPosition = new Vector3(lane * -laneWidth, y, spawnZ);
        }
    }
}
