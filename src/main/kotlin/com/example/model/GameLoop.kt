package com.example.model

import com.example.plugins.resetBots
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.serialization.json.Json
import kotlin.math.max

object GameLoop {
    private val inputChannel = Channel<MovementInput>(Channel.UNLIMITED)
    private lateinit var scope: CoroutineScope
    private var loopJob: Job? = null
    private lateinit var jsonCodec: Json
    private var maxPlayersSeen = 0

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

    fun resetRoundTracking() {
        maxPlayersSeen = 0
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

        val passiveEliminated = handleAllPlayerCollisions(PlayerRepository.getPlayers().values)
        if (passiveEliminated.isNotEmpty()) {
            for (eliminatedId in passiveEliminated) {
                PlayerRepository.removePlayer(eliminatedId)
                eliminatedPlayers.add(eliminatedId)
            }
        }

        if (eliminatedPlayers.isNotEmpty()) {
            notifyEliminated(eliminatedPlayers)
        }

        val playerCount = PlayerRepository.getPlayers().size
        maxPlayersSeen = max(maxPlayersSeen, playerCount)

        if (shouldResetRound(playerCount)) {
            resetRound()
            return
        }

        broadcastPlayers()
        if (updatedDots.isNotEmpty()) {
            broadcastDots(updatedDots.values.toList())
        }
    }

    private fun shouldResetRound(playerCount: Int): Boolean {
        if (maxPlayersSeen < 2) {
            return false
        }

        return playerCount == 1
    }

    private suspend fun resetRound() {
        val resetDots = Dots.resetAll()
        resetBots()
        PlayerRepository.getPlayers().values.forEach { it.resetForNewGame() }
        maxPlayersSeen = 0

        broadcastPlayers()
        broadcastDots(resetDots)

        val resetMessage = jsonCodec.encodeToString<OutgoingMessage>(ResetRoundMessage())
        for (session in SessionRegistry.getSessions()) {
            session.send(Frame.Text(resetMessage))
        }
    }

    private suspend fun notifyEliminated(eliminatedPlayers: Set<String>) {
        for (eliminatedId in eliminatedPlayers) {
            val eliminatedMessage =
                jsonCodec.encodeToString<OutgoingMessage>(EliminatedMessage(playerId = eliminatedId))
            SessionRegistry.getSession(eliminatedId)?.send(Frame.Text(eliminatedMessage))
        }

        for (eliminatedId in eliminatedPlayers) {
            SessionRegistry.getSession(eliminatedId)?.close(
                CloseReason(CloseReason.Codes.NORMAL, "Collided")
            )
            SessionRegistry.removeSession(eliminatedId)
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
