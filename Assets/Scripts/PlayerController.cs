using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Player capsule controller. Handles lane switching and jumping.
    /// Reads/writes <see cref="GameState"/> for lane + jump state.
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
        [SerializeField] private float jumpHeight = 1.8f;

        [Header("Base position")]
        [Tooltip("Y of the capsule center while running. Default 1.0 places a 2-unit-tall capsule with its bottom at Y=0 (ground level).")]
        [SerializeField] private float baseY = 1.0f;

        private float _currentX;

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
            // Subtle lean into the lane shift.
            transform.localRotation = Quaternion.Euler(0f, 0f, -_currentX * 4f);
        }

        void HandleInput(GameState s)
        {
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A))
            {
                if (s.Lane > -1)
                {
                    s.Lane -= 1;
                    s.NotifyStateChanged();
                }
            }
            else if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D))
            {
                if (s.Lane < 1)
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
            }
        }
    }
}
