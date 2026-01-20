package com.example.model

import kotlin.test.Test
import kotlin.test.assertEquals

class PlayerTest {

    @Test
    fun updateMovesPlayerBySpeed() {
        val player = Player()
        val startX = player.x
        val startY = player.y

        player.update(MovementInput(type = "input", id = player.id, w = true, a = false, s = false, d = true))

        assertEquals(startX + player.speed, player.x)
        assertEquals(startY - player.speed, player.y)
    }

    @Test
    fun updateClampsPlayerToWorldRadius() {
        val player = Player(x = 7000, y = 3000)

        player.update(MovementInput(type = "input", id = player.id, w = false, a = false, s = false, d = false))

        assertEquals(6000, player.x)
        assertEquals(3000, player.y)
    }
}
