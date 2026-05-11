using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Master gameplay tick. Advances DistAlong and the passive distance
    /// score every frame the game is playing, and ramps the speed up over
    /// time. Listens for Space/Enter to start a fresh game from
    /// idle/gameover.
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
                    s.StartGame();
                    _scoreAccum = 0f;
                }
                return;
            }

            // Speed ramps with score.
            s.Speed = Mathf.Min(maxSpeed, baseSpeed + s.Score / speedRampScoreDenominator);

            // Advance distance along the current segment.
            s.DistAlong += s.Speed * Time.deltaTime;

            // Passive distance score.
            _scoreAccum += s.Speed * Time.deltaTime * distanceToScoreFactor;
            if (_scoreAccum >= 1f)
            {
                int add = (int)_scoreAccum;
                _scoreAccum -= add;
                s.Score += add;
            }
        }
    }
}
