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
 *
 * @property id unique identifier for the player.
 * @property name display name for the player.
 * @property x current x position.
 * @property y current y position.
 * @property speed movement speed per tick.
 * @property radius collision radius.
 * @property colour visual color of the player.
 */
@Serializable
data class Player(
    val id: String = UUID.randomUUID().toString(),
    var name: String = "undefined",
    var x: Int = DEFAULT_X,
    var y: Int = DEFAULT_Y,
    val speed: Int = DEFAULT_SPEED,
    var radius: Int = PLAYER_RADIUS,
    var colour: String = randomColour()
) {
    init {
        val (nx, ny) = randomXY()
        x = nx
        y = ny
    }

    /**
     * Applies movement input and clamps position to the circular world.
     *
     * @param movementInput directional input from the client.
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
        /**
         * Picks a random colour from the player palette.
         *
         * @return randomly selected colour string.
         */
        private fun randomColour(): String = PLAYER_COLOURS.random()

        /**
         * Generates a random coordinate inside the world circle.
         *
         * @return a pair of x/y coordinates.
         */
        private fun randomXY(): Pair<Int, Int> {
            val angle = Random.nextDouble(0.0, 2 * PI)
            val radius = WORLD_RADIUS * sqrt(Random.nextDouble(0.0, 1.0))

            val x = (WORLD_CENTER + radius * cos(angle)).toInt()
            val y = (WORLD_CENTER + radius * sin(angle)).toInt()

            return x to y
        }
    }
}

/**
 * Client input payload describing movement keys.
 *
 * @property type message discriminator.
 * @property id player id for the input.
 * @property w true when moving up.
 * @property a true when moving left.
 * @property s true when moving down.
 * @property d true when moving right.
 */
@Serializable
data class MovementInput(
    val type: String, val id: String, val w: Boolean, val a: Boolean, val s: Boolean, val d: Boolean
)

/**
 * Client payload that configures a player's name and colour.
 *
 * @property type message discriminator.
 * @property name chosen player name.
 * @property colour chosen player colour.
 */
@Serializable
data class PlayerConfigInput(
    val type: String, val name: String, val colour: String
)

/**
 * Server message that initializes the local player state.
 *
 * @property type message discriminator.
 * @property player player data for the local client.
 */
@Serializable
data class InitPlayerMessage(val type: String = "InitPlayer", val player: Player)

/**
 * Server message that broadcasts the current player map.
 *
 * @property type message discriminator.
 * @property players map of player ids to player data.
 */
@Serializable
data class InitPlayersMessage(val type: String = "InitPlayers", val players: Map<String, Player>)

/**
 * Server message that broadcasts updated player positions.
 *
 * @property type message discriminator.
 * @property players map of player ids to player data.
 */
@Serializable
data class UpdatePlayersMessage(val type: String = "UpdatePlayers", val players: Map<String, Player>)

/**
 * Server message that notifies a client of elimination.
 *
 * @property type message discriminator.
 * @property playerId eliminated player id.
 */
@Serializable
data class EliminatedMessage(val type: String = "Eliminated", val playerId: String)
