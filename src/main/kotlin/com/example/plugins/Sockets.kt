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

fun Application.configureSockets() {
    val json = Json { encodeDefaults = true } // to fix the serialisation issue

    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(json)
    }
    routing {
        webSocket("/ws") { // websocketSession
            for (frame in incoming) {
                frame as? Frame.Text ?: continue
                val text = frame.readText()
                outgoing.send(Frame.Text("YOU SAID: $text"))
                if (text.equals("bye", ignoreCase = true)) {
                    close(CloseReason(CloseReason.Codes.NORMAL, "Client said BYE"))
                }
            }
        }

        webSocket("/movement") {
            val player = Player()
            PlayerStore.setPlayer(player)
            val initPlayerMsg = json.encodeToString(InitPlayer(type = "InitPlayer", player))
            val initPlayersMsg =
                json.encodeToString(InitPlayers(type = "InitPlayers", players = PlayerStore.getPlayers()))
            send(Frame.Text(initPlayerMsg))
            //send(Frame.Text(initPlayersMsg))

            try {
                for (frame in incoming) {
                    if (frame !is Frame.Text) continue

                    val movement = try {
                        json.decodeFromString<Movement>(frame.readText())
                    } catch (_: SerializationException) {
                        application.log.warn("Invalid Movement payload; ignoring")
                        continue
                    }

                    application.log.warn("This is a movement $movement")
                    player.update(movement)

                }
            } catch (e: Throwable) {
                application.log.warn("Unknown Error", e)
            } finally {
                // TODO: clean up resources
            }
        }
    }
}
