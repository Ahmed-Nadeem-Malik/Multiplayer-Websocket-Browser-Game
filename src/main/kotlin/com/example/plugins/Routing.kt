package com.example.plugins

import com.example.model.PLAYER_COLOURS
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.pebble.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    install(StatusPages) {
        status(HttpStatusCode.NotFound) { call, status ->
            call.respond(
                status,
                PebbleContent(
                    "404.peb",
                    mapOf(
                        "title" to "Page Not Found",
                        "message" to "Looks like you've used an invalid URL."
                    )
                )
            )
        }
    }
    routing {
        staticResources("/static", "static")

        get("/") {
            call.respond(
                PebbleContent(
                    "index.peb", mapOf(
                        "title" to "WebSocket Game", "playerColours" to PLAYER_COLOURS
                    )
                )
            )
        }

        get("/health") {
            call.respondText(
                text = "{\"status\":\"Healthy\"}", contentType = ContentType.Application.Json
            )
        }

    }
}

