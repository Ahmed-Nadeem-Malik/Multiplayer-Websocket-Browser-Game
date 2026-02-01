package com.example.model

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class PlayerTest {

    @Test
    fun updateMovesPlayerBySpeed() {
        val player = Player()
        val startX = player.x
        val startY = player.y
        val input = MovementInput(id = player.id, w = true, a = false, s = false, d = true)

        player.update(input)

        assertEquals(startX + player.speed, player.x)
        assertEquals(startY - player.speed, player.y)
    }

    @Test
    fun updateClampsPlayerToWorldRadius() {
        val player = Player()
        player.x = 7000
        player.y = 3000
        val input = MovementInput(id = player.id, w = false, a = false, s = false, d = false)

        player.update(input)

        assertEquals(6000, player.x)
        assertEquals(3000, player.y)
    }

    @Test
    fun resetForNewGameResetsRadiusAndPosition() {
        val player = Player(radius = 60)
        player.x = 10
        player.y = 10

        player.resetForNewGame()

        assertEquals(PLAYER_RADIUS, player.radius)
        assertNotEquals(10, player.x)
        assertNotEquals(10, player.y)
        val dx = (player.x - WORLD_CENTER.toInt()).toDouble()
        val dy = (player.y - WORLD_CENTER.toInt()).toDouble()
        val distance = kotlin.math.sqrt(dx * dx + dy * dy)
        assertTrue(distance <= WORLD_RADIUS)
    }
}
