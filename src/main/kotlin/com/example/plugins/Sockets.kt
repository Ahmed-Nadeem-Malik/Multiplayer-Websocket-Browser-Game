package com.example.plugins

import com.example.model.*
import io.ktor.serialization.kotlinx.*
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlin.time.Duration.Companion.seconds

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
                    val movementInput = decodeMovementInput(jsonCodec, frame.readText(), application) ?: continue
                    player.update(movementInput)

                    val eliminatedPlayers = handlePlayerCollisions(player)
                    for (eliminatedId in eliminatedPlayers) {
                        SessionRegistry.getSession(eliminatedId)?.close(
                            CloseReason(CloseReason.Codes.NORMAL, "Collided")
                        )
                        SessionRegistry.removeSession(eliminatedId)
                        PlayerRepository.removePlayer(eliminatedId)
                    }
                    broadcastPlayers(jsonCodec)

                    if (eliminatedPlayers.contains(player.id)) {
                        break
                    }

                    val updatedDots = Dots.tick().associateBy { it.id }.toMutableMap()
                    val collisionDots = handleDotCollisions(player)
                    for (dot in collisionDots) {
                        updatedDots[dot.id] = dot
                    }
                    if (updatedDots.isNotEmpty()) {
                        broadcastDots(jsonCodec, updatedDots.values.toList())
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

internal suspend fun handleDotCollisions(jsonCodec: Json, player: Player){
    val dots = Dots.allDots
    var scoreAdd = 0
    for (dot in dots) {
        if (dotCollision(player, dot)) {
            scoreAdd += dot.radius
        }
    }
    player.radius += scoreAdd
}
