package com.example.model

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class DotsTest {

    @Test
    fun tickUpdatesAfterInterval() {
        val baseTime = nextTickTime()

        val initialUpdates = Dots.tick(baseTime)
        val immediateUpdates = Dots.tick(baseTime + DEFAULT_DOT_INTERVAL_MS - 1)
        val laterUpdates = Dots.tick(baseTime + DEFAULT_DOT_INTERVAL_MS + 1)

        assertEquals(DOTS_UPDATE_COUNT, initialUpdates.size)
        assertTrue(immediateUpdates.isEmpty())
        assertEquals(DOTS_UPDATE_COUNT, laterUpdates.size)
    }

    @Test
    fun needsUpdateReflectsInterval() {
        val baseTime = nextTickTime()

        Dots.tick(baseTime)

        assertFalse(Dots.needsUpdate(baseTime + DEFAULT_DOT_INTERVAL_MS - 1))
        assertTrue(Dots.needsUpdate(baseTime + DEFAULT_DOT_INTERVAL_MS + 1))
    }

    @Test
    fun respawnDotReplacesDot() {
        val dot = Dots.respawnDot(0)

        assertEquals(0, dot.id)
        assertTrue(Dots.allDots.any { it.id == dot.id })
    }

    private fun nextTickTime(): Long {
        var candidate = System.currentTimeMillis()
        val step = DEFAULT_DOT_INTERVAL_MS + 1

        while (!Dots.needsUpdate(candidate)) {
            candidate += step
        }

        return candidate
    }
}
