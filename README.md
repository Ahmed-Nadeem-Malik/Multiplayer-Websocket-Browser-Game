# WebSocket Game Backend

A real-time multiplayer game backend built with Kotlin and Ktor. The server owns the game state, processes player inputs, resolves collisions, and broadcasts updates over WebSockets. It also serves the client entry page and static assets.

## Game Summary

Players join a shared arena, move with continuous input, collect dots to grow, and avoid collisions. The game is authoritative on the server, which applies movement updates, resolves interactions, and notifies all connected clients of world changes. Bots are spawned to keep the arena active even when few humans are connected.

## Backend Capabilities

### Core Systems

- **Authoritative state management** for players, dots, and sessions
- **Real-time WebSocket pipeline** for movement inputs and broadcasts
- **Collision resolution** with elimination notifications and session cleanup
- **Bot simulation** to populate the arena and stress live updates
- **HTTP routing** for the landing page and health checks
- **Template rendering** using Pebble for the index page

### Key Features

- **Low-latency updates** with broadcast fan-out to all sessions
- **Server-side validation** of player configuration and movement inputs
- **Graceful elimination flow** with delayed disconnects
- **Centralized registries** for player and session management
- **Pluggable Ktor modules** for routing, sockets, and templating

## System Architecture

The backend uses an event loop pattern around WebSockets. Player input drives game state updates, which are broadcast to every connected session.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Ktor Server                             │
├──────────────────────┬───────────────────────┬───────────────────┤
│   WebSocket Layer    │   Game State Engine   │   HTTP Routing    │
│                      │                       │                   │
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

## HTTP Routes

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Serves the game client entry page. |
| `GET` | `/health` | Returns a health check response. |

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
│   │       └── static/                   # Static assets for the client
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

## Development Notes

- Player updates are broadcast on every input event.
- Eliminations are sent before the session is closed to allow client UI updates.
- Bots reuse the same collision and broadcast pipeline as real players.

## What I Learned

- Designing an authoritative server loop for real-time multiplayer state.
- Managing concurrent WebSocket sessions and broadcast fan-out.
- Modeling game state changes with immutable messages and registries.
- Handling edge cases around eliminations and disconnects.
- Structuring a Ktor project with clear module boundaries.

## Technical Highlights

- Minimal dependencies for a focused backend runtime.
- Clear separation between transport (WebSockets) and game state logic.
- Deterministic collision handling driven by server-side state.
- Extensible plugin structure for routing, sockets, and templating.

## Troubleshooting

- If the server fails to start, confirm that `application.yaml` includes `ktor.deployment.port`.
- For WebSocket issues, verify that clients connect to `/movement` using `ws://`.
- If template rendering fails, confirm `templates/index.peb` is present.
