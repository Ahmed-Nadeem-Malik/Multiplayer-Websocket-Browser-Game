package com.example.plugins

import com.example.model.*
import io.ktor.serialization.kotlinx.*
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.delay
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.time.Duration.Companion.seconds

private const val ELIMINATION_DELAY_MS = 3000L

/**
 * Configures the WebSocket endpoint used for player movement updates.
 */
fun Application.configureSockets() {
    val jsonCodec = Json { encodeDefaults = true }

    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(jsonCodec)
    }

    routing {
        webSocket("/movement") {
            val player = Player()
            PlayerRepository.addPlayer(player)
            SessionRegistry.addSession(player.id, this)

            sendInitialState(jsonCodec, player)

            try {
                for (frame in incoming) {
                    if (frame !is Frame.Text) continue
                    val payload = frame.readText()
                    when (extractMessageType(jsonCodec, payload)) {
                        "InitConfig" -> {
                            val config = decodePlayerConfig(jsonCodec, payload, application) ?: continue
                            applyPlayerConfig(player, config)
                            broadcastPlayers(jsonCodec)
                        }

                        "input" -> {
                            val eliminated = handleMovementPayload(jsonCodec, payload, application, player)
                            if (eliminated) break
                        }
                    }
                }
            } catch (exception: Throwable) {
                application.log.warn("Unknown error", exception)
            } finally {
                SessionRegistry.removeSession(player.id)
                PlayerRepository.removePlayer(player.id)
                broadcastPlayers(jsonCodec)
            }
        }
    }
}

/**
 * Sends initial player identity and world state to the new session.
 */
internal suspend fun DefaultWebSocketServerSession.sendInitialState(jsonCodec: Json, player: Player) {
    val initPlayerMessage = jsonCodec.encodeToString(InitPlayerMessage(type = "InitPlayer", player))
    val initPlayersMessage =
        jsonCodec.encodeToString(InitPlayersMessage(type = "InitPlayers", players = PlayerRepository.getPlayers()))
    val initDotsMessage = jsonCodec.encodeToString(InitDotsMessage(type = "InitDots", dots = Dots.allDots))
    send(Frame.Text(initPlayerMessage))
    send(Frame.Text(initPlayersMessage))
    send(Frame.Text(initDotsMessage))
}

/**
 * Decodes movement input JSON payloads from the client.
 */
internal fun decodeMovementInput(
    jsonCodec: Json, payload: String, application: Application
): MovementInput? {
    return try {
        jsonCodec.decodeFromString<MovementInput>(payload)
    } catch (_: SerializationException) {
        application.log.warn("Invalid movement payload; ignoring")
        null
    }
}

internal fun decodePlayerConfig(
    jsonCodec: Json, payload: String, application: Application
): PlayerConfigInput? {
    return try {
        jsonCodec.decodeFromString<PlayerConfigInput>(payload)
    } catch (_: SerializationException) {
        application.log.warn("Invalid config payload; ignoring")
        null
    }
}

internal fun extractMessageType(jsonCodec: Json, payload: String): String? {
    return try {
        jsonCodec.parseToJsonElement(payload).jsonObject["type"]?.jsonPrimitive?.content
    } catch (_: Exception) {
        null
    }
}

internal fun applyPlayerConfig(player: Player, config: PlayerConfigInput) {
    val trimmedName = config.name.trim()
    player.name = trimmedName.ifEmpty { "undefined" }

    if (PLAYER_COLOURS.contains(config.colour)) {
        player.colour = config.colour
    }
}

private suspend fun handleMovementPayload(
    jsonCodec: Json, payload: String, application: Application, player: Player
): Boolean {
    val movementInput = decodeMovementInput(jsonCodec, payload, application) ?: return false
    player.update(movementInput)

    val eliminatedPlayers = handlePlayerCollisions(player)
    val updatedDots = updateDotsForPlayer(player)

    if (eliminatedPlayers.isNotEmpty()) {
        removePlayersFromRepository(eliminatedPlayers)
    }

    broadcastPlayers(jsonCodec)
    if (updatedDots.isNotEmpty()) {
        broadcastDots(jsonCodec, updatedDots)
    }

    if (eliminatedPlayers.isNotEmpty()) {
        delay(ELIMINATION_DELAY_MS)
        closeEliminatedSessions(eliminatedPlayers)
    }

    return eliminatedPlayers.contains(player.id)
}

private fun removePlayersFromRepository(eliminatedPlayers: Set<String>) {
    for (eliminatedId in eliminatedPlayers) {
        PlayerRepository.removePlayer(eliminatedId)
    }
}

private suspend fun closeEliminatedSessions(eliminatedPlayers: Set<String>) {
    for (eliminatedId in eliminatedPlayers) {
        SessionRegistry.getSession(eliminatedId)?.close(
            CloseReason(CloseReason.Codes.NORMAL, "Collided")
        )
        SessionRegistry.removeSession(eliminatedId)
    }
}

private fun updateDotsForPlayer(player: Player): List<Dot> {
    val updatedDots = Dots.tick().associateBy { it.id }.toMutableMap()
    val collisionDots = handleDotCollisions(player)

    for (dot in collisionDots) {
        updatedDots[dot.id] = dot
    }

    return updatedDots.values.toList()
}

/**
 * Broadcasts the latest player positions to all connected sessions.
 */
internal suspend fun broadcastPlayers(jsonCodec: Json) {
    val updatePlayersMessage =
        jsonCodec.encodeToString(UpdatePlayersMessage(type = "UpdatePlayers", players = PlayerRepository.getPlayers()))
    for (session in SessionRegistry.getSessions()) {
        session.send(Frame.Text(updatePlayersMessage))
    }
}

internal suspend fun broadcastDots(jsonCodec: Json, updatedDots: List<Dot>) {
    val updateDotsMessage = jsonCodec.encodeToString(UpdateDotsMessage(type = "UpdateDots", dots = updatedDots))
    for (session in SessionRegistry.getSessions()) {
        session.send(Frame.Text(updateDotsMessage))
    }
}
