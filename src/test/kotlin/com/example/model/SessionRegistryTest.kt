package com.example.model

import io.ktor.server.websocket.DefaultWebSocketServerSession
import io.mockk.mockk
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SessionRegistryTest {

    @Test
    fun addSessionStoresSession() = withSession("session-1") { session ->
        assertTrue(SessionRegistry.getSessions().contains(session))
    }

    @Test
    fun removeSessionDeletesSession() = withSession("session-2") { session ->
        SessionRegistry.removeSession("session-2")

        assertEquals(0, SessionRegistry.getSessions().count { it == session })
    }

    private inline fun withSession(id: String, block: (DefaultWebSocketServerSession) -> Unit) {
        val session = mockk<DefaultWebSocketServerSession>(relaxed = true)
        SessionRegistry.addSession(id, session)

        try {
            block(session)
        } finally {
            SessionRegistry.removeSession(id)
        }
    }
}
