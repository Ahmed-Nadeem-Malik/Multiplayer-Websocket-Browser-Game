package com.example.model

import io.ktor.server.websocket.DefaultWebSocketServerSession
import io.mockk.mockk
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SessionRegistryTest {

    @Test
    fun addSessionStoresSession() {
        val session = mockk<DefaultWebSocketServerSession>(relaxed = true)

        SessionRegistry.addSession("session-1", session)

        assertTrue(SessionRegistry.getSessions().contains(session))
        SessionRegistry.removeSession("session-1")
    }

    @Test
    fun removeSessionDeletesSession() {
        val session = mockk<DefaultWebSocketServerSession>(relaxed = true)
        SessionRegistry.addSession("session-2", session)

        SessionRegistry.removeSession("session-2")

        assertEquals(0, SessionRegistry.getSessions().count { it == session })
    }
}
