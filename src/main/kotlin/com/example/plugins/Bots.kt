package com.example.plugins

import com.example.model.*
import io.ktor.server.application.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.serialization.json.Json
import kotlin.math.max
import kotlin.random.Random

private const val BOT_COUNT = 100
private const val BOT_ID_PREFIX = "bot-"
private const val BOT_ID_START = 67
private const val BOT_MIN_DELAY_MS = 5L
private const val BOT_MAX_DELAY_MS = 15L
private const val BOT_MIN_STEPS = 120
private const val BOT_MAX_STEPS = 240
private const val BOT_MIN_DIRECTION_MS = 1000L
private const val BOT_MAX_DIRECTION_MS = 3000L
private const val BOT_AVG_DELAY_MS = (BOT_MIN_DELAY_MS + BOT_MAX_DELAY_MS) / 2

private data class BotState(
    val player: Player,
    var remainingSteps: Int,
    var movementInput: MovementInput,
)

fun Application.configureBots() {
    val jsonCodec = Json { encodeDefaults = true }
    val bots = createBots()

    bots.forEach { bot -> PlayerRepository.addPlayer(bot.player) }

    CoroutineScope(Dispatchers.Default).launch {
        while (isActive) {
            delay(Random.nextLong(BOT_MIN_DELAY_MS, BOT_MAX_DELAY_MS + 1))

            val updatedDots = Dots.tick().associateBy { it.id }.toMutableMap()
            val eliminatedPlayers = mutableSetOf<String>()

            for (bot in bots.toList()) {
                applyBotStep(bot)
                eliminatedPlayers.addAll(handlePlayerCollisions(bot.player))

                val collisionDots = handleDotCollisions(bot.player)
                for (dot in collisionDots) {
                    updatedDots[dot.id] = dot
                }
            }

            if (eliminatedPlayers.isNotEmpty()) {
                removeEliminatedBots(bots, eliminatedPlayers)
            }

            broadcastPlayers(jsonCodec)
            if (updatedDots.isNotEmpty()) {
                broadcastDots(jsonCodec, updatedDots.values.toList())
            }
        }
    }
}

private fun createBots(): MutableList<BotState> {
    return MutableList(BOT_COUNT) { index ->
        val player = Player(id = "$BOT_ID_PREFIX${BOT_ID_START + index}")
        BotState(
            player = player, remainingSteps = 0, movementInput = randomMovementInput(player.id)
        )
    }
}

private fun applyBotStep(bot: BotState) {
    if (bot.remainingSteps <= 0) {
        val durationMs = Random.nextLong(BOT_MIN_DIRECTION_MS, BOT_MAX_DIRECTION_MS + 1)
        bot.remainingSteps = max(1, (durationMs / BOT_AVG_DELAY_MS).toInt())
        bot.movementInput = randomMovementInput(bot.player.id)
    }

    bot.player.update(bot.movementInput)
    bot.remainingSteps -= 1
}

private suspend fun removeEliminatedBots(bots: MutableList<BotState>, eliminatedPlayers: Set<String>) {
    for (eliminatedId in eliminatedPlayers) {
        SessionRegistry.getSession(eliminatedId)?.close(
            CloseReason(CloseReason.Codes.NORMAL, "Collided")
        )
        SessionRegistry.removeSession(eliminatedId)
        PlayerRepository.removePlayer(eliminatedId)
        bots.removeAll { it.player.id == eliminatedId }
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
