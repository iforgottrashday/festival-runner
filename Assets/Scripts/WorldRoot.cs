using UnityEngine;

namespace FestivalRunner
{
    /// <summary>
    /// Rotates the World GameObject around its Y axis based on
    /// GameState.WorldRotation each frame. The Player and Camera live
    /// OUTSIDE this transform so they don't rotate — only the track +
    /// obstacles (children of World) swing around the camera during turns.
    /// </summary>
    public class WorldRoot : MonoBehaviour
    {
        void Update()
        {
            var s = GameState.Instance;
            if (s == null) return;
            transform.localRotation = Quaternion.Euler(0f, s.WorldRotation, 0f);
        }
    }
}
