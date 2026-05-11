using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Player capsule/character controller. Handles lane switching and
    /// jumping. Reads/writes <see cref="GameState"/> for lane + jump state.
    /// Drives an Animator if one is attached / assigned (sets the "Running"
    /// bool, fires "Jump" and "Trip" triggers).
    /// </summary>
    public class PlayerController : MonoBehaviour
    {
        [Header("Lane")]
        [Tooltip("World units between adjacent lanes.")]
        [SerializeField] private float laneWidth = 2.2f;

        [Tooltip("Higher = snappier lane changes.")]
        [SerializeField] private float laneSwitchSpeed = 14f;

        [Header("Jump")]
        [SerializeField] private float jumpDuration = 0.6f;
        [SerializeField] private float jumpHeight = 1.2f;

        [Header("Base position")]
        [Tooltip("Y of the player's pivot while running. 0 for a character whose pivot is at the feet (Mixamo). 1 for a 2-unit-tall capsule centered.")]
        [SerializeField] private float baseY = 0f;

        [Header("Animation")]
        [Tooltip("Optional. If assigned, the controller drives the Running bool + Jump/Trip triggers from game state.")]
        [SerializeField] private Animator animator;

        private float _currentX;
        private GameStatus _lastSeenStatus = GameStatus.Idle;

        void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
        }

        void Update()
        {
            var s = GameState.Instance;
            if (s == null) return;

            // Accept input only while actively running (and not mid-turn).
            if (s.Status == GameStatus.Playing && !s.IsTurning)
            {
                HandleInput(s);
            }

            // Smoothly interpolate to the target lane X. Negated because the
            // camera looks in -Z (rotated 180° around Y) in Unity's left-
            // handed coord system, which puts world +X on the camera's LEFT.
            // The negation keeps "Lane +1 = visually right" intuitive for input.
            float targetX = -s.Lane * laneWidth;
            _currentX = Mathf.Lerp(_currentX, targetX, Time.deltaTime * laneSwitchSpeed);

            // Jump arc (sine over jumpDuration).
            float jumpY = 0f;
            if (s.IsJumping)
            {
                float t = (Time.time - s.JumpStartTime) / jumpDuration;
                if (t >= 1f) s.IsJumping = false;
                else jumpY = Mathf.Sin(t * Mathf.PI) * jumpHeight;
            }

            transform.localPosition = new Vector3(_currentX, baseY + jumpY, 0f);

            // Drive the animator from game state.
            if (animator != null)
            {
                bool running = s.Status == GameStatus.Playing && !s.IsJumping;
                animator.SetBool("Running", running);

                // Fire the Trip trigger when status transitions to GameOver.
                if (s.Status == GameStatus.GameOver && _lastSeenStatus != GameStatus.GameOver)
                {
                    animator.SetTrigger("Trip");
                }
            }
            _lastSeenStatus = s.Status;
        }

        void HandleInput(GameState s)
        {
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A))
            {
                // Try a turn first; if not in the turn window or wrong direction,
                // fall through to a lane switch.
                if (!GameLoop.TryTriggerTurn(TurnDir.Left) && s.Lane > -1)
                {
                    s.Lane -= 1;
                    s.NotifyStateChanged();
                }
            }
            else if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D))
            {
                if (!GameLoop.TryTriggerTurn(TurnDir.Right) && s.Lane < 1)
                {
                    s.Lane += 1;
                    s.NotifyStateChanged();
                }
            }

            bool jumpPressed = Input.GetKeyDown(KeyCode.Space)
                            || Input.GetKeyDown(KeyCode.UpArrow)
                            || Input.GetKeyDown(KeyCode.W);
            if (jumpPressed && !s.IsJumping)
            {
                s.IsJumping = true;
                s.JumpStartTime = Time.time;
                s.NotifyStateChanged();
                if (animator != null) animator.SetTrigger("Jump");
            }
        }
    }
}
