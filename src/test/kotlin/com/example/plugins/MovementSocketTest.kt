package com.example.plugins

import com.example.model.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.server.testing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlin.test.*

class MovementSocketTest {

    private val jsonCodec = Json {
        encodeDefaults = true
        classDiscriminator = "type"
    }

    @Test
    fun decodeIncomingMessageParsesMovementInput() = testApplication {
        val payload = jsonCodec.encodeToString(
            MovementInput(id = "player-1", w = true, a = false, s = true, d = false)
        )

        val result = decodeIncomingMessage(jsonCodec, payload, application)

        val movement = result as? MovementInput
        assertNotNull(movement)
        assertTrue(movement.w)
        assertTrue(movement.s)
    }

    @Test
    fun decodeIncomingMessageReturnsNullForInvalidPayload() = testApplication {
        val result = decodeIncomingMessage(jsonCodec, "{bad json}", application)

        assertNull(result)
    }

    @Test
    fun decodeIncomingMessageParsesPlayerConfig() = testApplication {
        val payload = jsonCodec.encodeToString(
            PlayerConfigInput(name = "Player", colour = PLAYER_COLOURS.first())
        )

        val result = decodeIncomingMessage(jsonCodec, payload, application)

        val config = result as? PlayerConfigInput
        assertNotNull(config)
        assertEquals("Player", config.name)
        assertEquals(PLAYER_COLOURS.first(), config.colour)
    }

    @Test
    fun applyPlayerConfigTrimsNameAndValidatesColour() {
        val player = Player(name = "Old", colour = PLAYER_COLOURS.last())
        val invalidConfig = PlayerConfigInput(name = "   ", colour = "invalid")

        applyPlayerConfig(player, invalidConfig)

        assertEquals("undefined", player.name)
        assertEquals(PLAYER_COLOURS.last(), player.colour)

        val validConfig = PlayerConfigInput(name = "Alex", colour = PLAYER_COLOURS.first())

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
                GameLoop.init(this, jsonCodec, startLoop = false)
                GameLoop.tickOnceForTests()

                val updatesOne = framesOne.mapNotNull { frame ->
                    jsonCodec.decodeFromString<OutgoingMessage>((frame as Frame.Text).readText()) as? UpdatePlayersMessage
                }
                val updatesTwo = framesTwo.mapNotNull { frame ->
                    jsonCodec.decodeFromString<OutgoingMessage>((frame as Frame.Text).readText()) as? UpdatePlayersMessage
                }

                assertTrue(updatesOne.any { it.players.containsKey(player.id) })
                assertTrue(updatesTwo.any { it.players.containsKey(player.id) })
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

        SessionRegistry.addSession("session-1", sessionOne)
        SessionRegistry.addSession("session-2", sessionTwo)

        try {
            GameLoop.init(this, jsonCodec, startLoop = false)
            GameLoop.tickOnceForTests()

            val updatesOne = framesOne.mapNotNull { frame ->
                jsonCodec.decodeFromString<OutgoingMessage>((frame as Frame.Text).readText()) as? UpdateDotsMessage
            }
            val updatesTwo = framesTwo.mapNotNull { frame ->
                jsonCodec.decodeFromString<OutgoingMessage>((frame as Frame.Text).readText()) as? UpdateDotsMessage
            }

            assertTrue(updatesOne.isNotEmpty())
            assertTrue(updatesTwo.isNotEmpty())
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
                id = initPlayer.player.id,
                w = true,
                a = false,
                s = false,
                d = false
            )

            send(Frame.Text(jsonCodec.encodeToString(movementInput)))

            var roster: UpdatePlayersMessage? = null
            repeat(5) {
                val frame = incoming.receive() as Frame.Text
                val payload = frame.readText()
                val message = jsonCodec.decodeFromString<OutgoingMessage>(payload)
                if (message is UpdatePlayersMessage) {
                    roster = message
                    return@repeat
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
