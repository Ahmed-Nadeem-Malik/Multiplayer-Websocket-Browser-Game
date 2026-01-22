package com.example.plugins

import com.example.model.Dot
import com.example.model.Dots
import com.example.model.InitDotsMessage
import com.example.model.InitPlayerMessage
import com.example.model.InitPlayersMessage
import com.example.model.MovementInput
import com.example.model.Player
import com.example.model.PlayerConfigInput
import com.example.model.PlayerRepository
import com.example.model.SessionRegistry
import com.example.model.UpdateDotsMessage
import com.example.model.UpdatePlayersMessage
import com.example.model.PLAYER_COLOURS
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocket
import io.ktor.server.testing.testApplication
import io.ktor.server.websocket.DefaultWebSocketServerSession
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MovementSocketTest {

    private val jsonCodec = Json { encodeDefaults = true }

    @Test
    fun decodeMovementInputParsesValidPayload() = testApplication {
        val payload = jsonCodec.encodeToString(
            MovementInput(type = "input", id = "player-1", w = true, a = false, s = true, d = false)
        )

        val result = decodeMovementInput(jsonCodec, payload, application)

        assertNotNull(result)
        assertTrue(result.w)
        assertTrue(result.s)
    }

    @Test
    fun decodeMovementInputReturnsNullForInvalidPayload() = testApplication {
        val result = decodeMovementInput(jsonCodec, "{bad json}", application)

        assertNull(result)
    }

    @Test
    fun decodePlayerConfigParsesValidPayload() = testApplication {
        val payload = jsonCodec.encodeToString(
            PlayerConfigInput(type = "InitConfig", name = "Player", colour = PLAYER_COLOURS.first())
        )

        val result = decodePlayerConfig(jsonCodec, payload, application)

        assertNotNull(result)
        assertEquals("Player", result.name)
        assertEquals(PLAYER_COLOURS.first(), result.colour)
    }

    @Test
    fun decodePlayerConfigReturnsNullForInvalidPayload() = testApplication {
        val result = decodePlayerConfig(jsonCodec, "{bad json}", application)

        assertNull(result)
    }

    @Test
    fun extractMessageTypeReadsTypeField() {
        val payload = """{"type":"input","id":"player-1"}"""

        assertEquals("input", extractMessageType(jsonCodec, payload))
        assertNull(extractMessageType(jsonCodec, "{bad json}"))
    }

    @Test
    fun applyPlayerConfigTrimsNameAndValidatesColour() {
        val player = Player(name = "Old", colour = PLAYER_COLOURS.last())
        val invalidConfig = PlayerConfigInput(type = "InitConfig", name = "   ", colour = "invalid")

        applyPlayerConfig(player, invalidConfig)

        assertEquals("undefined", player.name)
        assertEquals(PLAYER_COLOURS.last(), player.colour)

        val validConfig = PlayerConfigInput(type = "InitConfig", name = "Alex", colour = PLAYER_COLOURS.first())

        applyPlayerConfig(player, validConfig)

        assertEquals("Alex", player.name)
        assertEquals(PLAYER_COLOURS.first(), player.colour)
    }

    @Test
    fun sendInitialStateSendsPlayerAndRoster() = runTest {
        withPlayer("player-1") { player ->
            val frames = mutableListOf<Frame>()
            val session = relaxedSession(frames)

            session.sendInitialState(jsonCodec, player)

            assertEquals(3, frames.size)
            val initPlayer = jsonCodec.decodeFromString<InitPlayerMessage>((frames[0] as Frame.Text).readText())
            val initPlayers = jsonCodec.decodeFromString<InitPlayersMessage>((frames[1] as Frame.Text).readText())
            val initDots = jsonCodec.decodeFromString<InitDotsMessage>((frames[2] as Frame.Text).readText())
            assertEquals(player.id, initPlayer.player.id)
            assertTrue(initPlayers.players.containsKey(player.id))
            assertTrue(initDots.dots.isNotEmpty())
        }
    }

    @Test
    fun broadcastPlayersSendsUpdatesToAllSessions() = runTest {
        withPlayer("player-2") { player ->
            val framesOne = mutableListOf<Frame>()
            val framesTwo = mutableListOf<Frame>()
            val sessionOne = relaxedSession(framesOne)
            val sessionTwo = relaxedSession(framesTwo)

            SessionRegistry.addSession("session-1", sessionOne)
            SessionRegistry.addSession("session-2", sessionTwo)

            try {
                broadcastPlayers(jsonCodec)

                assertEquals(1, framesOne.size)
                assertEquals(1, framesTwo.size)
                val updateMessage =
                    jsonCodec.decodeFromString<UpdatePlayersMessage>((framesOne[0] as Frame.Text).readText())
                assertTrue(updateMessage.players.containsKey(player.id))
            } finally {
                SessionRegistry.removeSession("session-1")
                SessionRegistry.removeSession("session-2")
            }
        }
    }

    @Test
    fun broadcastDotsSendsUpdatesToAllSessions() = runTest {
        val framesOne = mutableListOf<Frame>()
        val framesTwo = mutableListOf<Frame>()
        val sessionOne = relaxedSession(framesOne)
        val sessionTwo = relaxedSession(framesTwo)
        val dot = Dots.respawnDot(0)

        SessionRegistry.addSession("session-1", sessionOne)
        SessionRegistry.addSession("session-2", sessionTwo)

        try {
            broadcastDots(jsonCodec, listOf(dot))

            assertEquals(1, framesOne.size)
            assertEquals(1, framesTwo.size)
            val updateMessage =
                jsonCodec.decodeFromString<UpdateDotsMessage>((framesOne[0] as Frame.Text).readText())
            assertTrue(updateMessage.dots.any { it.id == dot.id })
        } finally {
            SessionRegistry.removeSession("session-1")
            SessionRegistry.removeSession("session-2")
        }
    }

    @Test
    fun movementSocketBroadcastsUpdatedPosition() = testApplication {
        application {
            configureSockets()
        }
        val client = createClient {
            install(WebSockets)
        }

        client.webSocket("/movement") {
            val initPlayerFrame = incoming.receive() as Frame.Text
            incoming.receive()
            incoming.receive()

            val initPlayer = jsonCodec.decodeFromString<InitPlayerMessage>(initPlayerFrame.readText())
            val movementInput = MovementInput(
                type = "input",
                id = initPlayer.player.id,
                w = true,
                a = false,
                s = false,
                d = false
            )

            send(Frame.Text(jsonCodec.encodeToString(movementInput)))

            var roster: UpdatePlayersMessage? = null
            val firstFrame = incoming.receive() as Frame.Text
            val firstPayload = firstFrame.readText()

            if (extractMessageType(jsonCodec, firstPayload) == "UpdatePlayers") {
                roster = jsonCodec.decodeFromString<UpdatePlayersMessage>(firstPayload)
            } else {
                val secondFrame = incoming.receive() as Frame.Text
                val secondPayload = secondFrame.readText()
                if (extractMessageType(jsonCodec, secondPayload) == "UpdatePlayers") {
                    roster = jsonCodec.decodeFromString<UpdatePlayersMessage>(secondPayload)
                }
            }

            assertNotNull(roster)
            val updatedPlayer = roster.players[initPlayer.player.id]

            assertNotNull(updatedPlayer)
        }
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

    private fun relaxedSession(frames: MutableList<Frame>): DefaultWebSocketServerSession {
        val session = mockk<DefaultWebSocketServerSession>(relaxed = true)
        coEvery { session.send(capture(frames)) } returns Unit
        return session
    }
}
