package com.example.plugins

import io.ktor.server.application.*
import io.ktor.server.metrics.micrometer.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.micrometer.prometheus.PrometheusConfig
import io.micrometer.prometheus.PrometheusMeterRegistry
import org.slf4j.event.Level

fun Application.configureMonitoring() {
    val meterRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)

    install(MicrometerMetrics) {
        registry = meterRegistry
    }
    install(CallLogging) {
        level = Level.INFO
        filter { requestCall -> requestCall.request.path().startsWith("/") }
    }
    routing {
        get("/metrics-micrometer") {
            call.respond(meterRegistry.scrape())
        }
    }
}
