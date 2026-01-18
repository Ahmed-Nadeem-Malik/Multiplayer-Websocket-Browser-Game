package com.example.model

import kotlinx.serialization.Serializable
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Serializable
data class Player(val id: String = UUID.randomUUID().toString(), var x: Int = 500, var y: Int = 500, val speed: Int = 5) {
    fun update(movement: Movement) {
        if (movement.w) this.y -= this.speed
        if (movement.a) this.x -= this.speed
        if (movement.s) this.y += this.speed
        if (movement.d) this.x += this.speed

        x = x.coerceIn(0, PLAYFIELD_WIDTH)
        y = y.coerceIn(0, PLAYFIELD_HEIGHT)
    }

    companion object {
        private const val PLAYFIELD_WIDTH = 1000
        private const val PLAYFIELD_HEIGHT = 1000
    }
}

@Serializable
data class Movement(val type: String, val id: String, val w: Boolean, val a: Boolean, val s: Boolean, val d: Boolean)

@Serializable
data class InitPlayer(val type: String = "InitPlayer", val player: Player)

@Serializable
data class InitPlayers(val type: String = "InitPlayers", val players: Map<String, Player>)
