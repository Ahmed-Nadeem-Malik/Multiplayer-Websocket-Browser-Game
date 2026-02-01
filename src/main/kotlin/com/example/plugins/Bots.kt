package com.example.plugins

import com.example.model.*
import io.ktor.server.application.*
import kotlinx.coroutines.*
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

private object BotManager {
    private val bots: MutableList<BotState> = mutableListOf()
    private val botLock = Any()
    private var loopJob: Job? = null

    fun init() {
        if (loopJob != null) return
        resetBots()
        loopJob = CoroutineScope(Dispatchers.Default).launch {
            while (isActive) {
                delay(Random.nextLong(BOT_MIN_DELAY_MS, BOT_MAX_DELAY_MS + 1))

                synchronized(botLock) {
                    val iterator = bots.iterator()
                    while (iterator.hasNext()) {
                        val bot = iterator.next()
                        if (PlayerRepository.getPlayer(bot.player.id) == null) {
                            iterator.remove()
                            continue
                        }

                        applyBotStep(bot)
                        GameLoop.enqueueInput(bot.movementInput)
                    }
                }
            }
        }
    }

    fun resetBots() {
        val existingBots = PlayerRepository.getPlayers().keys.filter { it.startsWith(BOT_ID_PREFIX) }
        existingBots.forEach(PlayerRepository::removePlayer)

        synchronized(botLock) {
            bots.clear()
            bots.addAll(createBots())
            bots.forEach { bot -> PlayerRepository.addPlayer(bot.player) }
        }
    }
}

fun resetBots() {
    BotManager.resetBots()
}

fun Application.configureBots() {
    BotManager.init()
}

private fun createBots(): MutableList<BotState> {
    return MutableList(BOT_COUNT) { index ->
        val player = Player(
            id = "$BOT_ID_PREFIX${BOT_ID_START + index}",
            name = "Bot"
        )
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
    bot.remainingSteps -= 1
}

private fun randomMovementInput(playerId: String): MovementInput {
    val options = listOf(
        MovementInput(id = playerId, w = true, a = false, s = false, d = false),
        MovementInput(id = playerId, w = false, a = true, s = false, d = false),
        MovementInput(id = playerId, w = false, a = false, s = true, d = false),
        MovementInput(id = playerId, w = false, a = false, s = false, d = true),
        MovementInput(id = playerId, w = true, a = true, s = false, d = false),
        MovementInput(id = playerId, w = true, a = false, s = false, d = true),
        MovementInput(id = playerId, w = false, a = true, s = true, d = false),
        MovementInput(id = playerId, w = false, a = false, s = true, d = true)
    )

    return options.random()
}
