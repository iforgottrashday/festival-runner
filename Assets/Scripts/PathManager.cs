using System.Collections.Generic;
using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Procedural path generator. Maintains a queue of upcoming segments;
    /// segments[0] is the current one. On each turn, segments[0] is
    /// dropped and a fresh segment is appended to keep the queue at the
    /// initial size.
    ///
    /// Attach to the GameManager GameObject alongside GameState/GameLoop.
    /// </summary>
    public class PathManager : MonoBehaviour
    {
        public static PathManager Instance { get; private set; }

        /// <summary>Last N units of a segment count as the turn window — the
        /// player must press the matching direction during this band or
        /// they hit the wall.</summary>
        public const float TurnWindowDistance = 14f;

        [Header("Segment lengths")]
        [SerializeField] private float minLength = 55f;
        [SerializeField] private float maxLength = 95f;

        [Header("Queue")]
        [Tooltip("How many segments are pre-generated and visible/known ahead.")]
        [SerializeField] private int initialQueueSize = 4;

        [Header("Variety")]
        [Range(0f, 1f)]
        [Tooltip("Bias toward alternating turn direction. 0 = pure random, 1 = always alternate.")]
        [SerializeField] private float alternateBias = 0.7f;

        public List<PathSegment> Segments { get; private set; } = new List<PathSegment>();

        public PathSegment Current => Segments.Count > 0 ? Segments[0] : null;
        public PathSegment Next => Segments.Count > 1 ? Segments[1] : null;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
        }

        void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        public void ResetPath()
        {
            Segments.Clear();
            for (int i = 0; i < initialQueueSize; i++)
            {
                Segments.Add(MakeSegment(i > 0 ? Segments[i - 1] : null));
            }
        }

        /// <summary>Shift to the next segment, generating a fresh one at the back.</summary>
        public void AdvanceToNext()
        {
            if (Segments.Count > 0) Segments.RemoveAt(0);
            var prev = Segments.Count > 0 ? Segments[Segments.Count - 1] : null;
            Segments.Add(MakeSegment(prev));
        }

        PathSegment MakeSegment(PathSegment prev)
        {
            TurnDir dir;
            if (prev != null && Random.value < alternateBias)
            {
                dir = prev.TurnDir == TurnDir.Left ? TurnDir.Right : TurnDir.Left;
            }
            else
            {
                dir = Random.value < 0.5f ? TurnDir.Left : TurnDir.Right;
            }
            float length = Random.Range(minLength, maxLength);
            return new PathSegment(length, dir);
        }
    }
}
