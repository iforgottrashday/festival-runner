using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Master gameplay tick. Owns:
    /// - Space/Enter from Idle/GameOver starts a fresh game (resets path).
    /// - During Play: advances DistAlong, ramps Speed, accumulates the
    ///   passive distance score, detects wall collisions, drives the
    ///   world rotation animation through turns, and fires CompleteTurn
    ///   when the player reaches the corner mid-rotation.
    /// </summary>
    public class GameLoop : MonoBehaviour
    {
        [Header("Speed")]
        [SerializeField] private float baseSpeed = 12f;
        [SerializeField] private float maxSpeed = 30f;
        [Tooltip("Higher = slower ramp. At score=this the speed has added ~1 unit.")]
        [SerializeField] private float speedRampScoreDenominator = 80f;

        [Header("Scoring")]
        [Tooltip("Passive distance-to-score conversion.")]
        [SerializeField] private float distanceToScoreFactor = 0.5f;
        [Tooltip("Bonus added when a turn completes successfully.")]
        [SerializeField] private int turnBonus = 50;

        private float _scoreAccum;

        void Update()
        {
            var s = GameState.Instance;
            if (s == null) return;

            // From idle or gameover: Space/Enter starts a new game.
            if (s.Status != GameStatus.Playing)
            {
                if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return))
                {
                    PathManager.Instance?.ResetPath();
                    s.StartGame();
                    _scoreAccum = 0f;
                }
                return;
            }

            // Speed ramps with score.
            s.Speed = Mathf.Min(maxSpeed, baseSpeed + s.Score / speedRampScoreDenominator);

            // Advance distance along the current segment — always, even during
            // a turn, so the player physically travels through the corner.
            s.DistAlong += s.Speed * Time.deltaTime;

            // Passive distance score.
            _scoreAccum += s.Speed * Time.deltaTime * distanceToScoreFactor;
            if (_scoreAccum >= 1f)
            {
                int add = (int)_scoreAccum;
                _scoreAccum -= add;
                s.Score += add;
            }

            var seg = PathManager.Instance?.Current;
            if (seg == null) return;

            if (s.IsTurning)
            {
                // Drive rotation by distance — hits ±90° exactly when
                // DistAlong reaches seg.Length.
                float turnDist = Mathf.Max(0.001f, seg.Length - s.TurnStartDistAlong);
                float traveled = s.DistAlong - s.TurnStartDistAlong;
                float t = Mathf.Clamp01(traveled / turnDist);
                float target = seg.TurnDir == TurnDir.Right ? -90f : 90f;
                s.WorldRotation = target * EaseInOutCubic(t);

                if (s.DistAlong >= seg.Length)
                {
                    CompleteTurn(s);
                }
            }
            else
            {
                // No turn triggered → reaching the end of the segment means
                // crashing into the wall.
                if (s.DistAlong >= seg.Length)
                {
                    s.EndGame();
                }
            }
        }

        void CompleteTurn(GameState s)
        {
            PathManager.Instance?.AdvanceToNext();
            s.DistAlong = 0f;
            s.IsTurning = false;
            s.Lane = 0;
            s.WorldRotation = 0f;
            s.TurnsCompleted += 1;
            s.Score += turnBonus;
            s.NotifyStateChanged();
        }

        /// <summary>Tries to initiate a turn. Returns true if accepted.</summary>
        public static bool TryTriggerTurn(TurnDir dir)
        {
            var s = GameState.Instance;
            var seg = PathManager.Instance?.Current;
            if (s == null || seg == null) return false;
            if (s.Status != GameStatus.Playing || s.IsTurning) return false;

            float distRemaining = seg.Length - s.DistAlong;
            if (distRemaining > PathManager.TurnWindowDistance) return false;
            if (seg.TurnDir != dir) return false;

            s.IsTurning = true;
            s.TurnStartDistAlong = s.DistAlong;
            s.NotifyStateChanged();
            return true;
        }

        static float EaseInOutCubic(float t)
        {
            return t < 0.5f ? 4f * t * t * t : 1f - Mathf.Pow(-2f * t + 2f, 3f) / 2f;
        }
    }
}
