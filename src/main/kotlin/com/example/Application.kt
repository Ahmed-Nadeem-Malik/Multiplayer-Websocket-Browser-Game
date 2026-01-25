package com.example

import com.example.plugins.configureBots
import com.example.plugins.configureRouting
import com.example.plugins.configureSockets
import com.example.plugins.configureTemplating
import io.ktor.server.application.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureSockets()
    configureBots()
    configureRouting()
    configureTemplating()
}
