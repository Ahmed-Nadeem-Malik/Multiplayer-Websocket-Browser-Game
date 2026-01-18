package com.example

import java.util.UUID

data class Player(val id: String = UUID.randomUUID().toString(), var x: Int = 500, var y: Int = 500, val speed: Int = 5) {
    fun update(movement: Movement) {
        if (movement.w) this.y += this.speed
        if (movement.a) this.x -= this.speed
        if (movement.s) this.y -= this.speed
        if (movement.d) this.x += this.speed
    }
}

