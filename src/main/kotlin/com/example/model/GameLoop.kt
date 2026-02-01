package com.example.model

import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.serialization.json.Json

object GameLoop {
    private val inputChannel = Channel<MovementInput>(Channel.UNLIMITED)
    private lateinit var scope: CoroutineScope
    private var loopJob: Job? = null
    private lateinit var jsonCodec: Json

    fun init(externalScope: CoroutineScope, jsonCodec: Json, startLoop: Boolean = true) {
        if (loopJob != null) return
        this.scope = externalScope
        this.jsonCodec = jsonCodec
        if (startLoop) {
            loopJob = externalScope.launch {
                runLoop()
            }
        }
    }

    fun enqueueInput(input: MovementInput) {
        inputChannel.trySend(input)
    }

    private suspend fun runLoop() {
        while (currentCoroutineContext().isActive) {
            tick()
            delay(SERVER_TICK_INTERVAL_MS)
        }
    }

    private suspend fun tick() {
        val updatedDots = Dots.tick().associateBy { it.id }.toMutableMap()
        val eliminatedPlayers = linkedSetOf<String>()

        while (true) {
            val input = inputChannel.tryReceive().getOrNull() ?: break
            val player = PlayerRepository.getPlayer(input.id) ?: continue

            player.update(input)

            val eliminated = handlePlayerCollisions(player)
            if (eliminated.isNotEmpty()) {
                for (eliminatedId in eliminated) {
                    PlayerRepository.removePlayer(eliminatedId)
                    eliminatedPlayers.add(eliminatedId)
                }
            }

            val collisionDots = handleDotCollisions(player)
            for (dot in collisionDots) {
                updatedDots[dot.id] = dot
            }
        }

        if (eliminatedPlayers.isNotEmpty()) {
            notifyEliminated(eliminatedPlayers)
        }

        broadcastPlayers()
        if (updatedDots.isNotEmpty()) {
            broadcastDots(updatedDots.values.toList())
        }
    }

    private suspend fun notifyEliminated(eliminatedPlayers: Set<String>) {
        for (eliminatedId in eliminatedPlayers) {
            val eliminatedMessage =
                jsonCodec.encodeToString<OutgoingMessage>(EliminatedMessage(playerId = eliminatedId))
            SessionRegistry.getSession(eliminatedId)?.send(Frame.Text(eliminatedMessage))
        }

        scope.launch {
            delay(ELIMINATION_DELAY_MS)
            for (eliminatedId in eliminatedPlayers) {
                SessionRegistry.getSession(eliminatedId)?.close(
                    CloseReason(CloseReason.Codes.NORMAL, "Collided")
                )
                SessionRegistry.removeSession(eliminatedId)
            }
        }
    }

    private suspend fun broadcastPlayers() {
        val updatePlayersMessage = jsonCodec.encodeToString<OutgoingMessage>(
            UpdatePlayersMessage(players = PlayerRepository.getPlayers())
        )
        for (session in SessionRegistry.getSessions()) {
            session.send(Frame.Text(updatePlayersMessage))
        }
    }

    private suspend fun broadcastDots(updatedDots: List<Dot>) {
        val updateDotsMessage = jsonCodec.encodeToString<OutgoingMessage>(UpdateDotsMessage(dots = updatedDots))
        for (session in SessionRegistry.getSessions()) {
            session.send(Frame.Text(updateDotsMessage))
        }
    }

    internal suspend fun tickOnceForTests() {
        check(::jsonCodec.isInitialized) { "GameLoop.init must be called before ticking." }
        tick()
    }
}
