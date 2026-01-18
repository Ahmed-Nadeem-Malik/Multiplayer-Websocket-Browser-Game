package com.example

import io.ktor.serialization.kotlinx.*
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlin.time.Duration.Companion.seconds

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
        contentConverter = KotlinxWebsocketSerializationConverter(Json)
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

            val initMsg = Json.encodeToString(InitPlayer(id = player.id))
            send(Frame.Text(initMsg))

            try {
                for (frame in incoming) {
                    if (frame !is Frame.Text) continue

                    val movement = try {
                        Json.decodeFromString<Movement>(frame.readText())
                    } catch (_: SerializationException) {
                        application.log.warn("Invalid Movement payload; ignoring")
                        continue
                    }

                    application.log.warn("This is a movement $movement")
                }
            } catch (e: Throwable) {
                application.log.warn("Unknown Error", e)
            } finally {
                // TODO: clean up resources
            }
        }
    }
}
