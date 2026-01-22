package com.example.model

import kotlinx.serialization.Serializable

object Dots {
    private var lastTick = 0L
    private val dotsById: MutableMap<Int, Dot> = mutableMapOf()

    val allDots: List<Dot>
        get() = dotsById.values.toList()

    init {
        repeat(NUM_DOTS) { id ->
            dotsById[id] = Dot(id = id)
        }
    }

    fun needsUpdate(now: Long = System.currentTimeMillis()): Boolean {
        return now - lastTick >= DEFAULT_DOT_INTERVAL_MS
    }

    fun tick(now: Long = System.currentTimeMillis()): List<Dot> {
        if (!needsUpdate(now)) return emptyList()
        lastTick = now

        val updated = allDots.shuffled().take(DOTS_UPDATE_COUNT)
        updated.forEach { it.update() }
        return updated
    }

    fun respawnDot(id: Int): Dot {
        val dot = Dot(id = id)
        dotsById[id] = dot
        return dot
    }
}

@Serializable
data class InitDotsMessage(val type: String = "InitDots", val dots: List<Dot> = Dots.allDots)

@Serializable
data class UpdateDotsMessage(val type: String = "UpdateDots", val dots: List<Dot>)
