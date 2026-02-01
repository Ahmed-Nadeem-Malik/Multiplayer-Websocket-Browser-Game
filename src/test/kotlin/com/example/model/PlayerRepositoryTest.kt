package com.example.model

import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PlayerRepositoryTest {

    @BeforeTest
    fun setup() {
        PlayerRepository.clear()
    }

    @AfterTest
    fun teardown() {
        PlayerRepository.clear()
    }

    @Test
    fun addPlayerStoresPlayer() = withPlayer("player-1") { player ->
        assertTrue(PlayerRepository.getPlayers().containsKey(player.id))
    }

    @Test
    fun removePlayerDeletesPlayer() = withPlayer("player-2") { player ->
        PlayerRepository.removePlayer(player.id)

        assertFalse(PlayerRepository.getPlayers().containsKey(player.id))
    }

    @Test
    fun getPlayersReturnsSnapshot() = withPlayer("player-3") { player ->
        val snapshot = PlayerRepository.getPlayers()

        assertEquals(1, snapshot.size)
        assertTrue(snapshot.containsKey(player.id))
    }

    @Test
    fun getPlayerReturnsPlayer() = withPlayer("player-4") { player ->
        val fetched = PlayerRepository.getPlayer(player.id)

        assertEquals(player, fetched)
    }

    private inline fun withPlayer(id: String, block: (Player) -> Unit) {
        val player = Player(id = id)
        PlayerRepository.addPlayer(player)

        try {
            block(player)
        } finally {
            PlayerRepository.removePlayer(player.id)
        }
    }
}
