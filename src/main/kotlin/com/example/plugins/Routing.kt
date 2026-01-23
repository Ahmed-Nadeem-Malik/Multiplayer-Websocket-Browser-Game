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
        exception<Throwable> { call, cause ->
            call.respondText(text = "500: $cause", status = HttpStatusCode.InternalServerError)
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
            data class HealthStatusResponse(val status: String)
            call.respond(HealthStatusResponse("Healthy"))
        }

    }
}
