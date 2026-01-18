package com.example.model

import io.ktor.server.websocket.*
import java.util.concurrent.ConcurrentHashMap

object SessionStore {
    private val sessions = ConcurrentHashMap<String, DefaultWebSocketServerSession>()

    fun addSession(id: String, session: DefaultWebSocketServerSession) {
        sessions[id] = session
    }

    fun removeSession(id: String) {
        sessions.remove(id)
    }

    fun getSessions(): Collection<DefaultWebSocketServerSession> = sessions.values
}
