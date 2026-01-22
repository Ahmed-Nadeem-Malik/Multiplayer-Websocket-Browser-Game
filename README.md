# Multiplayer WebSocket Browser Game (Agar.io-Inspired)

A real-time, Agar.io-style multiplayer arena built with Kotlin + Ktor. This project showcases an authoritative game server, a WebSocket-driven client, and a fast broadcast loop that keeps every player in sync. It’s a compact but serious demonstration of real-time networking, game-state management, and server-side simulation.

## Why This Project Stands Out

- **Authoritative server loop** that owns all player, dot, and collision state
- **High-frequency WebSocket pipeline** for input capture and world updates
- **Deterministic collision handling** with elimination events and graceful cleanup
- **Bot simulation layer** that stress-tests the arena under load
- **Clean modular Ktor architecture** for routing, sockets, templating, and game logic
- **TypeScript client architecture** with dedicated modules for rendering, input orchestration, and protocol handling
- **Polished client UX** with a responsive canvas renderer and reconnect handling

## Gameplay Overview

Players spawn into a shared circular arena, consume dots to grow, and collide to eliminate smaller opponents. Movement is continuous, input-driven, and validated server-side. The server broadcasts authoritative updates to all sessions, while bots keep the world active even with low player counts.

## Client Implementation (TypeScript)

The browser client is written in TypeScript under `src/main/resources/src/ts/` with dedicated modules for the render loop and entity modeling (`game.ts`), WebSocket protocol handling and reconnect logic (`websocket.ts`), input/menu orchestration with a high-frequency input loop (`main.ts`), drawing utilities and grid/world rendering (`utils.ts`), and shared constants (`constants.ts`). These sources compile to the `static/js/` assets served by the Ktor app.

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│                         Ktor Server                              │
├──────────────────────┬───────────────────────┬───────────────────┤
│   WebSocket Layer    │   Game State Engine   │   HTTP Routing    │
│ • /movement channel  │ • Player registry     │ • / index page    │
│ • Input decoding     │ • Dot registry        │ • /health check   │
│ • Broadcast updates  │ • Collision handling  │ • static assets   │
└──────────────────────┴───────────────────────┴───────────────────┘
```

## WebSocket Protocol

### Endpoint

`ws://<host>:<port>/movement`

### Server Messages

| Type | Purpose |
| --- | --- |
| `InitPlayer` | Assigned player state for the new connection. |
| `InitPlayers` | Full player list at connect time. |
| `InitDots` | Initial dot list at connect time. |
| `UpdatePlayers` | Broadcast whenever player states change. |
| `UpdateDots` | Broadcast whenever dot states change. |
| `Eliminated` | Sent to a player when they collide and are removed. |

### Client Messages

| Type | Purpose |
| --- | --- |
| `InitConfig` | Set player name and colour. |
| `input` | Movement input with directional booleans. |

## Project Structure

```
websocketGame/
├── build.gradle.kts                     # Build config and dependencies
├── README.md                            # Project documentation
├── src/
│   ├── main/
│   │   ├── kotlin/com/example/
│   │   │   ├── Application.kt            # Application entry point
│   │   │   ├── model/
│   │   │   │   ├── Dot.kt                # Dot representation
│   │   │   │   ├── Dots.kt               # Dot registry and tick updates
│   │   │   │   ├── MovementInput.kt      # Movement input payload model
│   │   │   │   ├── Player.kt             # Player state and update logic
│   │   │   │   ├── PlayerConfigInput.kt  # Player config payload model
│   │   │   │   ├── PlayerRepository.kt   # In-memory player registry
│   │   │   │   ├── SessionRegistry.kt    # WebSocket session registry
│   │   │   │   ├── UpdateMessages.kt     # Broadcast message models
│   │   │   │   └── collisions.kt         # Collision handling logic
│   │   │   └── plugins/
│   │   │       ├── Bots.kt               # Bot movement loop and updates
│   │   │       ├── Routing.kt            # HTTP routing and status pages
│   │   │       ├── Sockets.kt            # WebSocket endpoint + broadcast
│   │   │       └── Templating.kt         # Pebble template configuration
│   │   └── resources/
│   │       ├── application.yaml          # Ktor configuration (port, modules)
│   │       ├── templates/index.peb       # Server-rendered HTML entry page
│   │       ├── static/                   # Static assets for the client
│   │       └── src/ts/                   # TypeScript source for client logic
│   │           ├── constants.ts          # Shared client constants
│   │           ├── game.ts               # Canvas renderer + entities
│   │           ├── main.ts               # Menu flow + input loop
│   │           ├── utils.ts              # Render helpers + grid
│   │           └── websocket.ts          # WebSocket protocol client
│   └── test/
│       └── kotlin/com/example/
│           ├── model/                    # Player + registry tests
│           └── plugins/                  # WebSocket handling tests
```

## Configuration

The server reads `application.yaml` for deployment settings.

| Key | Description |
| --- | --- |
| `ktor.deployment.port` | Listening port for the server. |

## Running Locally

### Prerequisites

- JDK 21+
- Gradle (wrapper included)

### Quick Start

```bash
./gradlew run
```

### Tests

```bash
./gradlew test
```

Once running, the server listens on `http://0.0.0.0:8080` by default.

## What This Demonstrates

- Real-time multiplayer systems design with server authority
- Concurrent WebSocket session management and broadcast fan-out
- Game-state modeling with deterministic collision rules
- Kotlin/Ktor patterns and modular service layout
- TypeScript client architecture for rendering, input, and protocol handling
- A client loop that renders smoothly under continuous updates

## Troubleshooting

- If the server fails to start, confirm that `application.yaml` includes `ktor.deployment.port`.
- For WebSocket issues, verify that clients connect to `/movement` using `ws://`.
- If template rendering fails, confirm `templates/index.peb` is present.
