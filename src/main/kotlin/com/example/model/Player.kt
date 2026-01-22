package com.example.model

import kotlinx.serialization.Serializable
import java.util.*
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

/**
 * Represents a player in the world with movement and color state.
 */
@Serializable
data class Player(
    val id: String = UUID.randomUUID().toString(),
    var x: Int = DEFAULT_X,
    var y: Int = DEFAULT_Y,
    val speed: Int = DEFAULT_SPEED,
    var radius: Int = PLAYER_RADIUS,
    val colour: String = randomColour()
) {
    init {
        val (nx, ny) = randomXY()
        x = nx
        y = ny
    }

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
        val distance = sqrt((dx * dx + dy * dy))
        if (distance > WORLD_RADIUS) {
            val scale = WORLD_RADIUS / distance
            x = (WORLD_CENTER + dx * scale).toInt()
            y = (WORLD_CENTER + dy * scale).toInt()
        }
    }

    companion object {
        private fun randomColour(): String = PLAYER_COLOURS.random()

        private fun randomXY(): Pair<Int, Int> {
            val angle = Random.nextDouble(0.0, 2 * PI)
            val radius = WORLD_RADIUS * sqrt(Random.nextDouble(0.0, 1.0))

            val x = (WORLD_CENTER + radius * cos(angle)).toInt()
            val y = (WORLD_CENTER + radius * sin(angle)).toInt()

            return x to y
        }
    }
}

@Serializable
data class MovementInput(
    val type: String, val id: String, val w: Boolean, val a: Boolean, val s: Boolean, val d: Boolean
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

/**
 * Server message that broadcasts updated player positions.
 */
@Serializable
data class UpdatePlayersMessage(val type: String = "UpdatePlayers", val players: Map<String, Player>)

