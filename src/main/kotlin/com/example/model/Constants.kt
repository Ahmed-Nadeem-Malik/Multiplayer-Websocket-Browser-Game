package com.example.model

/**
 * Radius of the circular world in game units.
 */
const val WORLD_RADIUS = 3000.0

/**
 * Center coordinate used for world calculations.
 */
const val WORLD_CENTER = WORLD_RADIUS

/**
 * Default spawn X coordinate for new players.
 */
const val DEFAULT_X = WORLD_CENTER.toInt()

/**
 * Default spawn Y coordinate for new players.
 */
const val DEFAULT_Y = WORLD_CENTER.toInt()

/**
 * Base movement speed for player updates.
 */
const val DEFAULT_SPEED = 3

/**
 * Interval between randomized dot refreshes.
 */
const val DEFAULT_DOT_INTERVAL_MS = 20_000L

/**
 * Total number of dots maintained in the world.
 */
const val NUM_DOTS = 750

/**
 * Number of dots to update on each refresh tick.
 */
const val DOTS_UPDATE_COUNT = 5

/**
 * Default player radius in world units.
 */
const val PLAYER_RADIUS = 24

/**
 * Default dot radius in world units.
 */
const val DOT_RADIUS = 8

/**
 * Server tick rate in Hz.
 */
const val SERVER_TICK_RATE_HZ = 128

/**
 * Server tick interval in milliseconds.
 */
const val SERVER_TICK_INTERVAL_MS = 1000L / SERVER_TICK_RATE_HZ

/**
 * Color palette used for dots.
 */
val DOT_COLOURS = listOf(
    "#39FF14", "#FF073A", "#00E5FF", "#FF00FF", "#FF9100"
)

/**
 * Color palette used for player avatars.
 */
val PLAYER_COLOURS = listOf(
    "#FF1744",
    "#FF6D00",
    "#FFEA00",
    "#76FF03",
    "#00E5FF",
    "#2979FF",
    "#651FFF",
    "#D500F9",
    "#FF4081",
    "#00C853",
    "#1DE9B6",
    "#00B0FF",
    "#FF9100",
    "#C6FF00",
    "#F50057"
)
