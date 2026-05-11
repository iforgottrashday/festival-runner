using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Locks the camera at a fixed offset behind and above the player,
    /// looking slightly down the track. Does NOT follow lane shifts — the
    /// player slides between lanes relative to a stable camera, which is
    /// the over-the-shoulder runner feel we want.
    /// Attach to the Main Camera.
    /// </summary>
    public class CameraFollow : MonoBehaviour
    {
        [Tooltip("Where the camera sits in world space.")]
        [SerializeField] private Vector3 worldPosition = new Vector3(0f, 4.5f, 6.5f);

        [Tooltip("World point the camera aims at.")]
        [SerializeField] private Vector3 lookAtTarget = new Vector3(0f, 1f, -8f);

        void Start()
        {
            ApplyPose();
        }

        // Re-apply on edit-time too so the framing is visible without entering Play.
        void OnValidate()
        {
            if (Application.isPlaying) return;
            ApplyPose();
        }

        void ApplyPose()
        {
            transform.position = worldPosition;
            transform.LookAt(lookAtTarget, Vector3.up);
        }
    }
}
