package com.example.model

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CollisionTest {

    @Test
    fun dotCollisionDetectsOverlap() {
        val player = Player(radius = 30)
        val dot = Dot(id = 1)
        player.x = 100
        player.y = 100
        dot.x = 100
        dot.y = 100

        assertTrue(dotCollision(player, dot))

        dot.x = player.x + player.radius + dot.radius + 1
        dot.y = player.y + player.radius + dot.radius + 1

        assertFalse(dotCollision(player, dot))
    }

    @Test
    fun playerCollisionRequiresLargerPlayer() {
        val player = Player(radius = 30)
        val other = Player(radius = 30)
        player.x = 200
        player.y = 200
        other.x = 200
        other.y = 200

        assertFalse(playerCollision(player, other))
    }

    @Test
    fun playerCollisionDetectsOverlapWhenLarger() {
        val player = Player(radius = 40)
        val other = Player(radius = 20)
        player.x = 250
        player.y = 250
        other.x = 250
        other.y = 250

        assertTrue(playerCollision(player, other))
    }

    @Test
    fun handleDotCollisionsRespawnsDotAndGrowsPlayer() {
        val player = Player(radius = 30)
        val dot = Dots.allDots.first()
        val startingRadius = player.radius
        player.x = dot.x
        player.y = dot.y

        val updatedDots = handleDotCollisions(player)

        assertTrue(updatedDots.any { it.id == dot.id })
        assertTrue(player.radius > startingRadius)
    }

    @Test
    fun handlePlayerCollisionsEliminatesSmallerPlayer() {
        val player = Player(id = "player-a", radius = 40)
        val other = Player(id = "player-b", radius = 20)
        player.x = 300
        player.y = 300
        other.x = 300
        other.y = 300

        PlayerRepository.addPlayer(player)
        PlayerRepository.addPlayer(other)

        try {
            val eliminated = handlePlayerCollisions(player)

            assertTrue(eliminated.contains(other.id))
            assertEquals(44, player.radius)
        } finally {
            PlayerRepository.removePlayer(player.id)
            PlayerRepository.removePlayer(other.id)
        }
    }
}
