package com.example.model

import kotlinx.serialization.Serializable
import java.util.*
import kotlin.math.sqrt

/**
 * Represents a player in the world with movement and color state.
 */
@Serializable
data class Player(
    val id: String = UUID.randomUUID().toString(),
    var x: Int = DEFAULT_X,
    var y: Int = DEFAULT_Y,
    val speed: Int = DEFAULT_SPEED,
    val colour: String = randomColour()
) {
    /**
     * Applies movement input and clamps position to the circular world.
     */
    fun update(movementInput: MovementInput) {
        if (movementInput.w) y -= speed
        if (movementInput.a) x -= speed
        if (movementInput.s) y += speed
        if (movementInput.d) x += speed

        val dx = x - WORLD_CENTER
        val dy = y - WORLD_CENTER
        val distance = sqrt((dx * dx + dy * dy).toDouble())
        if (distance > WORLD_RADIUS) {
            val scale = WORLD_RADIUS / distance
            x = (WORLD_CENTER + dx * scale).toInt()
            y = (WORLD_CENTER + dy * scale).toInt()
        }
    }

    companion object {
        private const val WORLD_RADIUS = 3000.0
        private const val WORLD_CENTER = WORLD_RADIUS
        private const val DEFAULT_X = WORLD_CENTER.toInt()
        private const val DEFAULT_Y = WORLD_CENTER.toInt()
        private const val DEFAULT_SPEED = 5
        private val NEON_COLOURS = listOf(
            "#39FF14",
            "#FF073A",
            "#00E5FF",
            "#FF00FF",
            "#FF9100"
        )

        private fun randomColour(): String = NEON_COLOURS.random()
    }
}

/**
 * Client input message for movement keys.
 */
@Serializable
data class MovementInput(
    val type: String,
    val id: String,
    val w: Boolean,
    val a: Boolean,
    val s: Boolean,
    val d: Boolean
)

/**
 * Server message that initializes the local player state.
 */
@Serializable
data class InitPlayerMessage(val type: String = "InitPlayer", val player: Player)

/**
 * Server message that broadcasts the current player map.
 */
@Serializable
data class InitPlayersMessage(val type: String = "InitPlayers", val players: Map<String, Player>)
