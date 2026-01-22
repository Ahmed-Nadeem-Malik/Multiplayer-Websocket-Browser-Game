package com.example.model

fun dotCollision(player: Player, dot: Dot): Boolean {
    val dx = dot.x - player.x
    val dy = dot.y - player.y
    val radius = player.radius + dot.radius

    return (dx * dx + dy * dy) <= radius * radius
}

fun playerCollision(player: Player, other: Player): Boolean {
    val dx = other.x - player.x
    val dy = other.y - player.y
    val radius = player.radius + other.radius

    return (dx * dx + dy * dy) <= radius * radius
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
