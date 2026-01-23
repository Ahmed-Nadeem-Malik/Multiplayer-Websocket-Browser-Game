package com.example.model

import java.util.concurrent.ConcurrentHashMap

/**
 * Thread-safe storage for active players keyed by id.
 */
object PlayerRepository {
    private val playersById = ConcurrentHashMap<String, Player>()

    /**
     * Returns a snapshot of the current player map.
     */
    fun getPlayers(): Map<String, Player> = playersById.toMap()

    /**
     * Adds or replaces a player in the repository.
     */
    fun addPlayer(player: Player) {
        playersById[player.id] = player
    }

    /**
     * Removes a player by id.
     */
    fun removePlayer(id: String) {
        playersById.remove(id)
    }
}
