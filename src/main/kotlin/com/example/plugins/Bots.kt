package com.example.plugins

import com.example.model.Dots
import com.example.model.MovementInput
import com.example.model.Player
import com.example.model.PlayerRepository
import com.example.model.SessionRegistry
import com.example.model.handleDotCollisions
import com.example.model.handlePlayerCollisions
import io.ktor.server.application.Application
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlin.random.Random

private const val BOT_COUNT = 100
private const val BOT_ID_PREFIX = "bot-"
private const val BOT_ID_START = 67
private const val BOT_MIN_DELAY_MS = 30L
private const val BOT_MAX_DELAY_MS = 80L
private const val BOT_MIN_STEPS = 120
private const val BOT_MAX_STEPS = 240

fun Application.configureBots() {
    val jsonCodec = Json { encodeDefaults = true }
    val bots = createBots()

    bots.forEach(PlayerRepository::addPlayer)

    CoroutineScope(Dispatchers.Default).launch {
        while (isActive) {
            delay(Random.nextLong(BOT_MIN_DELAY_MS, BOT_MAX_DELAY_MS + 1))

            val updatedDots = Dots.tick().associateBy { it.id }.toMutableMap()
            val eliminatedPlayers = mutableSetOf<String>()

            for (bot in bots.toList()) {
                applyBotSteps(bot)
                eliminatedPlayers.addAll(handlePlayerCollisions(bot))

                val collisionDots = handleDotCollisions(bot)
                for (dot in collisionDots) {
                    updatedDots[dot.id] = dot
                }
            }

            broadcastPlayers(jsonCodec)
            if (updatedDots.isNotEmpty()) {
                broadcastDots(jsonCodec, updatedDots.values.toList())
            }

            if (eliminatedPlayers.isNotEmpty()) {
                removeEliminatedBots(bots, eliminatedPlayers)
            }
        }
    }
}

private fun createBots(): MutableList<Player> {
    return MutableList(BOT_COUNT) { index ->
        Player(id = "$BOT_ID_PREFIX${BOT_ID_START + index}")
    }
}

private fun applyBotSteps(bot: Player) {
    val steps = Random.nextInt(BOT_MIN_STEPS, BOT_MAX_STEPS + 1)
    repeat(steps) {
        bot.update(randomMovementInput(bot.id))
    }
}

private suspend fun removeEliminatedBots(bots: MutableList<Player>, eliminatedPlayers: Set<String>) {
    for (eliminatedId in eliminatedPlayers) {
        SessionRegistry.getSession(eliminatedId)?.close(
            CloseReason(CloseReason.Codes.NORMAL, "Collided")
        )
        SessionRegistry.removeSession(eliminatedId)
        PlayerRepository.removePlayer(eliminatedId)
        bots.removeAll { it.id == eliminatedId }
    }
}

private fun randomMovementInput(playerId: String): MovementInput {
    val options = listOf(
        MovementInput(type = "bot", id = playerId, w = true, a = false, s = false, d = false),
        MovementInput(type = "bot", id = playerId, w = false, a = true, s = false, d = false),
        MovementInput(type = "bot", id = playerId, w = false, a = false, s = true, d = false),
        MovementInput(type = "bot", id = playerId, w = false, a = false, s = false, d = true),
        MovementInput(type = "bot", id = playerId, w = true, a = true, s = false, d = false),
        MovementInput(type = "bot", id = playerId, w = true, a = false, s = false, d = true),
        MovementInput(type = "bot", id = playerId, w = false, a = true, s = true, d = false),
        MovementInput(type = "bot", id = playerId, w = false, a = false, s = true, d = true)
    )

    return options.random()
}
