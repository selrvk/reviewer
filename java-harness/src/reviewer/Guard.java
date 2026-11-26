package reviewer;

/**
 * Loop/method guard injected into user code. CheerpJ runs Java on the browser's main
 * thread and can't preempt a tight loop, so time limits are enforced cooperatively:
 * every loop iteration and method entry calls tick(), which throws once the deadline passes.
 */
public final class Guard {
    private Guard() { }

    public static volatile long deadline = Long.MAX_VALUE;
    private static int counter;

    public static void tick() {
        if ((++counter & 255) == 0 && System.currentTimeMillis() > deadline) {
            throw new TimeLimitExceeded();
        }
    }

    public static final class TimeLimitExceeded extends Error {
        TimeLimitExceeded() { super("Time limit exceeded", null, false, false); }
    }
}
