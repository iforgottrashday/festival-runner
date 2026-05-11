namespace FestivalRunner
{
    public enum TurnDir
    {
        Left,
        Right,
    }

    /// <summary>
    /// One leg of the path: a straight of given length that ends with a
    /// 90° turn in the specified direction. The player must trigger the
    /// matching turn within the turn window before reaching the end of
    /// this segment, or they crash into the wall.
    /// </summary>
    [System.Serializable]
    public class PathSegment
    {
        public float Length;
        public TurnDir TurnDir;

        public PathSegment(float length, TurnDir turnDir)
        {
            Length = length;
            TurnDir = turnDir;
        }
    }
}
