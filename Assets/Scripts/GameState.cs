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

        public bool IsTurning;
        public int TurnsCompleted;

        /// <summary>
        /// Fires on discrete state changes (start, end, lane change, etc.).
        /// Per-frame mutations (DistAlong, Speed) do NOT fire this.
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
