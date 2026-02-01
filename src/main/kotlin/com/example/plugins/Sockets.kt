package com.example.plugins

import com.example.model.*
import io.ktor.serialization.kotlinx.*
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import kotlinx.serialization.json.Json
import kotlin.time.Duration.Companion.seconds

/**
 * Configures the WebSocket endpoint used for player movement updates.
 */
fun Application.configureSockets() {
    val jsonCodec = Json {
        encodeDefaults = true
        classDiscriminator = "type"
    }

    GameLoop.init(this, jsonCodec)

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
                handleIncomingFrames(jsonCodec, application, player)
            } catch (exception: Throwable) {
                application.log.warn("Unknown error", exception)
            } finally {
                SessionRegistry.removeSession(player.id)
                PlayerRepository.removePlayer(player.id)
            }
        }
    }
}
