package com.example.model

import com.example.plugins.resetBots
import io.ktor.server.application.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json


/**
 * Consumes incoming WebSocket frames and dispatches game updates.
 *
 * @param jsonCodec configured JSON serializer.
 * @param application application logger owner.
 * @param player current player for the session.
 */
internal suspend fun DefaultWebSocketServerSession.handleIncomingFrames(
    jsonCodec: Json, application: Application, player: Player
) {
    for (frame in incoming) {
        if (frame !is Frame.Text) continue

        val payload = frame.readText()
        val message = decodeIncomingMessage(jsonCodec, payload, application) ?: continue
        when (message) {
            is PlayerConfigInput -> {
                applyPlayerConfig(player, message)
            }

            is ResetGameMessage -> {
                val players = PlayerRepository.getPlayers()
                if (players.size != 1 || !players.containsKey(player.id)) {
                    continue
                }
                applyPlayerConfig(player, PlayerConfigInput(message.name, message.colour))
                player.resetForNewGame()
                val resetDots = Dots.resetAll()
                resetBots()
                broadcastDots(jsonCodec, resetDots)
                broadcastPlayers(jsonCodec)
            }

            is MovementInput -> {
                GameLoop.enqueueInput(message)
            }
        }
    }

}

/**
 * Sends initial player identity and world state to the new session.
 *
 * @param jsonCodec configured JSON serializer.
 * @param player newly connected player.
 */
internal suspend fun DefaultWebSocketServerSession.sendInitialState(jsonCodec: Json, player: Player) {
    val initPlayerMessage = jsonCodec.encodeToString<OutgoingMessage>(InitPlayerMessage(player))
    val initPlayersMessage = jsonCodec.encodeToString<OutgoingMessage>(
        InitPlayersMessage(players = PlayerRepository.getPlayers())
    )
    val initDotsMessage = jsonCodec.encodeToString<OutgoingMessage>(InitDotsMessage(dots = Dots.allDots))
    send(Frame.Text(initPlayerMessage))
    send(Frame.Text(initPlayersMessage))
    send(Frame.Text(initDotsMessage))
}

/**
 * Decodes inbound WebSocket payloads into typed messages.
 *
 * @param jsonCodec configured JSON serializer.
 * @param payload raw message payload.
 * @param application application logger owner.
 * @return decoded message or null when invalid.
 */
fun decodeIncomingMessage(
    jsonCodec: Json, payload: String, application: Application
): IncomingMessage? {
    return try {
        jsonCodec.decodeFromString<IncomingMessage>(payload)
    } catch (_: SerializationException) {
        application.log.warn("Invalid payload; ignoring")
        null
    }
}

/**
 * Applies player configuration values after validation.
 *
 * @param player player to update.
 * @param config requested configuration.
 */
fun applyPlayerConfig(player: Player, config: PlayerConfigInput) {
    val trimmedName = config.name.trim()
    player.name = trimmedName.ifEmpty { "undefined" }

    if (PLAYER_COLOURS.contains(config.colour)) {
        player.colour = config.colour
    }
}

private suspend fun broadcastDots(jsonCodec: Json, dots: List<Dot>) {
    val updateDotsMessage = jsonCodec.encodeToString<OutgoingMessage>(UpdateDotsMessage(dots = dots))
    for (session in SessionRegistry.getSessions()) {
        session.send(Frame.Text(updateDotsMessage))
    }
}

private suspend fun broadcastPlayers(jsonCodec: Json) {
    val updatePlayersMessage = jsonCodec.encodeToString<OutgoingMessage>(
        UpdatePlayersMessage(players = PlayerRepository.getPlayers())
    )
    for (session in SessionRegistry.getSessions()) {
        session.send(Frame.Text(updatePlayersMessage))
    }
}
