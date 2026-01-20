package com.example.model

import io.ktor.server.websocket.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Thread-safe registry of active WebSocket sessions by player id.
 */
object SessionRegistry {
    private val sessionsById = ConcurrentHashMap<String, DefaultWebSocketServerSession>()

    /**
     * Registers a session for a connected player.
     */
    fun addSession(id: String, session: DefaultWebSocketServerSession) {
        sessionsById[id] = session
    }

    /**
     * Removes a session when the player disconnects.
     */
    fun removeSession(id: String) {
        sessionsById.remove(id)
    }

    /**
     * Returns all active WebSocket sessions.
     */
    fun getSessions(): Collection<DefaultWebSocketServerSession> = sessionsById.values
}
