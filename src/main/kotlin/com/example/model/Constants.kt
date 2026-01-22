package com.example.model

const val WORLD_RADIUS = 3000.0
const val WORLD_CENTER = WORLD_RADIUS
const val DEFAULT_X = WORLD_CENTER.toInt()
const val DEFAULT_Y = WORLD_CENTER.toInt()
const val DEFAULT_SPEED = 3
const val DEFAULT_DOT_INTERVAL_MS = 20_000L
const val NUM_DOTS = 750
const val DOTS_UPDATE_COUNT = 5
const val PLAYER_RADIUS = 24
const val DOT_RADIUS = 8
val DOT_COLOURS = listOf(
    "#39FF14", "#FF073A", "#00E5FF", "#FF00FF", "#FF9100"
)
val PLAYER_COLOURS = listOf(
    "#FF1744", "#FF6D00", "#FFEA00", "#76FF03", "#00E5FF",
    "#2979FF", "#651FFF", "#D500F9", "#FF4081", "#00C853",
    "#1DE9B6", "#00B0FF", "#FF9100", "#C6FF00", "#F50057"
)
