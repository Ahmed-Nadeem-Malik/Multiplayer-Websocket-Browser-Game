package com.example.model

import java.util.concurrent.ConcurrentHashMap

object PlayerStore {
    private val players = ConcurrentHashMap<String, Player>()

    fun getPlayers(): Map<String, Player> = players.toMap()

    fun setPlayer(player: Player) {
        players[player.id] = player
    }
}


