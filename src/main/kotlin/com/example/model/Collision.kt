package com.example.model

/**
 * Computes the squared distance for a delta vector.
 *
 * @param dx horizontal delta.
 * @param dy vertical delta.
 * @return squared distance without a square root.
 */
private fun distanceSquared(dx: Int, dy: Int): Int = dx * dx + dy * dy

/**
 * Checks whether a delta vector is within a collision radius.
 *
 * @param dx horizontal delta.
 * @param dy vertical delta.
 * @param radius collision radius to compare against.
 * @return true when the delta fits inside the radius.
 */
private fun hasCollision(dx: Int, dy: Int, radius: Int): Boolean {
    return distanceSquared(dx, dy) <= radius * radius
}

/**
 * Determines whether a player consumes a dot.
 *
 * @param player player attempting to consume the dot.
 * @param dot dot being checked.
 * @return true when the player overlaps the dot radius.
 */
fun dotCollision(player: Player, dot: Dot): Boolean {
    if (player.radius <= dot.radius) {
        return false
    }

    val dx = dot.x - player.x
    val dy = dot.y - player.y
    val radius = player.radius - dot.radius
    return hasCollision(dx, dy, radius)
}

/**
 * Determines whether one player consumes another.
 *
 * @param player first player to check.
 * @param other other player to check.
 * @return true when the larger player overlaps the smaller.
 */
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

/**
 * Applies dot collisions, growing the player and respawning dots.
 *
 * @param player player to check against available dots.
 * @return list of dots that were respawned.
 */
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

/**
 * Resolves player collisions and returns eliminated player ids.
 *
 * @param player player initiating collision checks.
 * @return ids of players that were eliminated.
 */
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

/**
 * Resolves collisions for all players and returns eliminated ids.
 *
 * @param players current players to evaluate.
 * @return ids of players that were eliminated.
 */
fun handleAllPlayerCollisions(players: Collection<Player>): Set<String> {
    val playerList = players.toList()
    val eliminated = mutableSetOf<String>()

    for (i in playerList.indices) {
        val player = playerList[i]
        if (player.id in eliminated) continue

        for (j in i + 1 until playerList.size) {
            val other = playerList[j]
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
    }

    return eliminated
}
