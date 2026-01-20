package com.example.model

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PlayerRepositoryTest {

    @Test
    fun addPlayerStoresPlayer() {
        val player = Player(id = "player-1")

        PlayerRepository.addPlayer(player)

        assertTrue(PlayerRepository.getPlayers().containsKey(player.id))
        PlayerRepository.removePlayer(player.id)
    }

    @Test
    fun removePlayerDeletesPlayer() {
        val player = Player(id = "player-2")
        PlayerRepository.addPlayer(player)

        PlayerRepository.removePlayer(player.id)

        assertFalse(PlayerRepository.getPlayers().containsKey(player.id))
    }

    @Test
    fun getPlayersReturnsSnapshot() {
        val player = Player(id = "player-3")
        PlayerRepository.addPlayer(player)

        val snapshot = PlayerRepository.getPlayers()
        PlayerRepository.removePlayer(player.id)

        assertEquals(1, snapshot.size)
        assertTrue(snapshot.containsKey(player.id))
    }
}
