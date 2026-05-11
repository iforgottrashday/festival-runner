using System;
using UnityEngine;

namespace FestivalRunner
{
    public enum GameStatus
    {
        Idle,
        Playing,
        GameOver,
    }

    /// <summary>
    /// Central game state. Attach to a single GameManager GameObject.
    /// All gameplay scripts read via <see cref="Instance"/>.
    /// </summary>
    public class GameState : MonoBehaviour
    {
        public static GameState Instance { get; private set; }

        [Header("Runtime state (read-only at edit time)")]
        public GameStatus Status = GameStatus.Idle;
        public int Score;
        public int HighScore;

        // -1 left, 0 center, 1 right
        public int Lane;

        // Distance traveled along the current segment.
        public float DistAlong;

        // Current forward speed in world units / second.
        public float Speed = 12f;

        public bool IsJumping;
        public float JumpStartTime;

        // ---- Turn / path state ----

        /// <summary>True while the trip-flash + world rotation animation is playing.</summary>
        public bool IsTurning;

        /// <summary>DistAlong value at the moment a turn was triggered. Used to drive
        /// the rotation animation by progress (not by time).</summary>
        public float TurnStartDistAlong;

        /// <summary>Current world rotation around Y, in degrees. Animates 0 → ±90° during
        /// a turn, snaps back to 0 when CompleteTurn fires. Read by WorldRoot.</summary>
        public float WorldRotation;

        public int TurnsCompleted;

        /// <summary>
        /// Fires on discrete state changes (start, end, lane change, turn trigger, etc.).
        /// Per-frame mutations (DistAlong, Speed, WorldRotation) do NOT fire this.
        /// </summary>
        public event Action OnStateChanged;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            HighScore = PlayerPrefs.GetInt("FR_HighScore", 0);
        }

        void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        public void StartGame()
        {
            Status = GameStatus.Playing;
            Score = 0;
            Lane = 0;
            DistAlong = 0f;
            Speed = 12f;
            IsJumping = false;
            IsTurning = false;
            TurnStartDistAlong = 0f;
            WorldRotation = 0f;
            TurnsCompleted = 0;
            OnStateChanged?.Invoke();
        }

        public void EndGame()
        {
            if (Status != GameStatus.Playing) return;
            Status = GameStatus.GameOver;
            if (Score > HighScore)
            {
                HighScore = Score;
                PlayerPrefs.SetInt("FR_HighScore", HighScore);
                PlayerPrefs.Save();
            }
            OnStateChanged?.Invoke();
        }

        public void ToIdle()
        {
            Status = GameStatus.Idle;
            OnStateChanged?.Invoke();
        }

        public void NotifyStateChanged() => OnStateChanged?.Invoke();
    }
}
