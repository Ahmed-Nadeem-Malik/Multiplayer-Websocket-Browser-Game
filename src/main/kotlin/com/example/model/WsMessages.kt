package com.example.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Sealed inbound message types from clients.
 */
@Serializable
sealed interface IncomingMessage

/**
 * Client input payload describing movement keys.
 *
 * @property id player id for the input.
 * @property w true when moving up.
 * @property a true when moving left.
 * @property s true when moving down.
 * @property d true when moving right.
 */
@Serializable
@SerialName("input")
data class MovementInput(
    val id: String, val w: Boolean, val a: Boolean, val s: Boolean, val d: Boolean
) : IncomingMessage

/**
 * Client payload that configures a player's name and colour.
 *
 * @property name chosen player name.
 * @property colour chosen player colour.
 */
@Serializable
@SerialName("InitConfig")
data class PlayerConfigInput(
    val name: String, val colour: String
) : IncomingMessage

/**
 * Client payload that requests a fresh round.
 *
 * @property name updated player name.
 * @property colour updated player colour.
 */
@Serializable
@SerialName("Reset")
data class ResetGameMessage(
    val name: String, val colour: String
) : IncomingMessage

/**
 * Sealed outbound message types sent to clients.
 */
@Serializable
sealed interface OutgoingMessage

/**
 * Server message that initializes the local player state.
 *
 * @property player player data for the local client.
 */
@Serializable
@SerialName("InitPlayer")
data class InitPlayerMessage(val player: Player) : OutgoingMessage

/**
 * Server message that broadcasts the current player map.
 *
 * @property players map of player ids to player data.
 */
@Serializable
@SerialName("InitPlayers")
data class InitPlayersMessage(val players: Map<String, Player>) : OutgoingMessage

/**
 * Server message that broadcasts updated player positions.
 *
 * @property players map of player ids to player data.
 */
@Serializable
@SerialName("UpdatePlayers")
data class UpdatePlayersMessage(val players: Map<String, Player>) : OutgoingMessage

/**
 * Server message that notifies a client of elimination.
 *
 * @property playerId eliminated player id.
 */
@Serializable
@SerialName("Eliminated")
data class EliminatedMessage(val playerId: String) : OutgoingMessage

/**
 * Server message that initializes dot state for a client.
 *
 * @property dots initial dot list.
 */
@Serializable
@SerialName("InitDots")
data class InitDotsMessage(val dots: List<Dot> = Dots.allDots) : OutgoingMessage

/**
 * Server message that broadcasts updated dots.
 *
 * @property dots updated dot list.
 */
@Serializable
@SerialName("UpdateDots")
data class UpdateDotsMessage(val dots: List<Dot>) : OutgoingMessage

/**
 * Server message that signals a round reset.
 */
@Serializable
@SerialName("ResetRound")
data class ResetRoundMessage(val status: String = "Reset") : OutgoingMessage
