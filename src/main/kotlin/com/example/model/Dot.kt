package com.example.model

import kotlinx.serialization.Serializable
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

/**
 * Represents a collectible dot in the world.
 *
 * @property id unique identifier for the dot.
 * @property colour current dot color.
 * @property radius collision radius for the dot.
 */
@Serializable
data class Dot(
    val id: Int, var colour: String = DOT_COLOURS.random(), val radius: Int = DOT_RADIUS
) {
    var x: Int
    var y: Int

    init {
        val (nx, ny) = randomXY()
        x = nx
        y = ny
    }

    /**
     * Refreshes the dot position using a randomized point in the world.
     */
    fun update() {
        val (nx, ny) = randomXY()
        x = nx
        y = ny
    }

    companion object {
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
