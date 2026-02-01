package com.example.model


/**
 * Manages the server-side dot collection and refresh schedule.
 */
object Dots {
    private var lastTick = 0L
    private val dotsById: MutableMap<Int, Dot> = mutableMapOf()

    /**
     * Returns a snapshot of all dots.
     */
    val allDots: List<Dot>
        get() = dotsById.values.toList()

    init {
        repeat(NUM_DOTS) { id ->
            dotsById[id] = Dot(id = id)
        }
    }

    /**
     * Checks whether enough time has passed to refresh dots.
     *
     * @param now current timestamp in milliseconds.
     * @return true if a refresh should occur.
     */
    fun needsUpdate(now: Long = System.currentTimeMillis()): Boolean {
        return now - lastTick >= DEFAULT_DOT_INTERVAL_MS
    }

    /**
     * Updates a subset of dots when the refresh interval passes.
     *
     * @param now current timestamp in milliseconds.
     * @return dots that were updated.
     */
    fun tick(now: Long = System.currentTimeMillis()): List<Dot> {
        if (!needsUpdate(now)) return emptyList()
        lastTick = now

        val updated = allDots.shuffled().take(DOTS_UPDATE_COUNT)
        updated.forEach { it.update() }
        return updated
    }

    /**
     * Respawns a dot with a new randomized position.
     *
     * @param id identifier of the dot to respawn.
     * @return the newly created dot instance.
     */
    fun respawnDot(id: Int): Dot {
        val dot = Dot(id = id)
        dotsById[id] = dot
        return dot
    }

    /**
     * Reinitializes all dots for a fresh round.
     */
    fun resetAll(): List<Dot> {
        lastTick = 0L
        dotsById.clear()
        repeat(NUM_DOTS) { id ->
            dotsById[id] = Dot(id = id)
        }
        return allDots
    }
}
