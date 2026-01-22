package com.example.model

private fun distanceSquared(dx: Int, dy: Int): Int = dx * dx + dy * dy

private fun hasCollision(dx: Int, dy: Int, radius: Int): Boolean {
    return distanceSquared(dx, dy) <= radius * radius
}

fun dotCollision(player: Player, dot: Dot): Boolean {
    if (player.radius <= dot.radius) {
        return false
    }

    val dx = dot.x - player.x
    val dy = dot.y - player.y
    val radius = player.radius - dot.radius

    return hasCollision(dx, dy, radius)
}

fun playerCollision(player: Player, other: Player): Boolean {
    val (larger, smaller) = if (player.radius > other.radius) {
        player to other
    } else if (other.radius > player.radius) {
        other to player
    } else {
        return false
    }

    val dx = smaller.x - larger.x
    val dy = smaller.y - larger.y
    val radius = larger.radius - smaller.radius

    return hasCollision(dx, dy, radius)
}

fun handleDotCollisions(player: Player): List<Dot> {
    val dots = Dots.allDots
    var radiusGain = 0
    val updatedDots = mutableListOf<Dot>()

    for (dot in dots) {
        if (dotCollision(player, dot)) {
            radiusGain += (dot.radius * 0.2).toInt()
            updatedDots.add(Dots.respawnDot(dot.id))
        }
    }

    if (radiusGain > 0) {
        player.radius += radiusGain
    }

    return updatedDots
}

fun handlePlayerCollisions(player: Player): Set<String> {
    val eliminated = mutableSetOf<String>()

    for (other in PlayerRepository.getPlayers().values) {
        if (other.id == player.id) continue
        if (other.id in eliminated || player.id in eliminated) continue
        if (!playerCollision(player, other)) continue

        val (larger, smaller) = if (player.radius >= other.radius) {
            player to other
        } else {
            other to player
        }

        val gain = (smaller.radius * 0.2).toInt()
        larger.radius += gain
        eliminated.add(smaller.id)
    }

   return eliminated
}
