# 🧠 Quiz Peers

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20WebRTC%20%7C%20PostgreSQL-blue)](#-the-engineer-side)
[![Realtime](https://img.shields.io/badge/Realtime-WebSocket%20%26%20P2P%20Voice-orange)](#web-sockets--real-time-state-machine)

Quiz Peers is a real-time, interactive multiplayer quiz platform that combines competitive trivia and cooperative matchmaking. Featuring built-in peer-to-peer audio communication via WebRTC, players can interact live while playing traditional competitive quizzes or personality-matching "Similarity" quizzes to discover their "soulmate" or "lone wolf" inside the group.

Built as a TypeScript monorepo, the project provides a seamless, zero-latency gaming experience backed by a custom WebSocket state machine and a relational database.

---

## 🚀 Key Features

### 1. Dual Gameplay Modes
*   **Trivia Mode (Competitive):** Traditional quiz setup where players compete for points based on correct answers and response speed. Includes categories, difficulty levels, dynamic round-by-round leaderboards, and sound effects.
*   **Similarity Mode (Social/Matchmaking):** A casual, opinion-based mode where questions have no "correct" answers. Instead, player answers are analyzed at the end of the session to reveal pairwise matching statistics and social archetypes.

### 2. Peer-to-Peer Voice Rooms
*   **WebRTC Integration:** Built-in live audio streaming using PeerJS.
*   **Zero Server Load:** Media streams are routed directly browser-to-browser in a mesh network, keeping server bandwidth usage to a minimum.
*   **Rich Controls:** Local mute/unmute controls, audio level visualization, and active speaker highlighting.

### 3. Real-Time Room Orchestration
*   **Custom WebSocket Protocol:** Manages room creations, join/leave flows, ready states, and gameplay state transitions.
*   **Interactive Controls:** Host-led game lobbies, timer skip voting, auto-play progression toggles, and instant text chat.

### 4. Admin Management Dashboard
*   **Content Management:** Full CRUD interface for categories, quizzes, options, and questions.
*   **Interactive Media Support:** Upload question images and audio clips directly to Cloudflare R2 / AWS S3 buckets.
*   **Validation Rules:** Automatic enforcement of data integrity (e.g., Trivia questions require a designated correct option, while Similarity questions do not).

---

## 📂 Project Structure

This project is organized as a monorepo utilizing npm workspaces:

```
quiz-peers-monorepo/
├── client/                 # React + Vite frontend (Tailwind CSS, Redux Toolkit, NextUI)
├── server/                 # Express + TypeScript WebSocket server (Node.js, PG, Cloudflare R2)
└── shared/                 # Shared TypeScript interfaces & types between Client & Server
```

---

## 🛠️ Developer Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v22.0.0 or higher recommended)
*   [PostgreSQL](https://www.postgresql.org/) (Running instance)
*   Cloudflare R2 or AWS S3 credentials (for media uploads)

### 1. Database Configuration
Create a database named `quiz_peers` in PostgreSQL and run the schema setup script:
```bash
psql -U postgres -d quiz_peers -f server/src/database/database.sql
```

### 2. Environment Variables Setup

Create a `.env` file in the `/server` directory:
```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (Provide either DATABASE_URL or individual credentials)
DATABASE_URL=postgresql://username:password@localhost:5432/quiz_peers
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=quiz_peers

# Cloudflare R2 / AWS S3 Config (Optional for media uploads)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=quiz-peers-media
R2_PUBLIC_URL=https://pub-your-subdomain.r2.dev
```

Create a `.env` file in the `/client` directory:
```env
VITE_SERVER_API_URL=http://localhost:3000/api
VITE_WEBSOCKET_URL=ws://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
```

### 3. Dependency Installation & Building
From the root directory, install all dependencies for client, server, and shared workspaces:
```bash
npm install
```

### 4. Running the Project Locally
To run the client and server concurrently in development mode, run:
*   **Start Backend:** `npm run server:dev`
*   **Start Frontend:** `npm run client:dev`

### 5. Seed Data Import
To populate the database with default Similarity questions, run the import script inside the server directory:
```bash
# In the root or server workspace
npm run import:similarity -w server
```

---

## ⚙️ The Engineer Side (Architecture & Tech Stack)

```mermaid
flowchart TD
    subgraph Client [Client - React Application]
        UI[Tailwind & NextUI Views] <--> Redux[Redux Toolkit Store]
        Redux <--> WSClient[WebSocket Hook]
        Redux <--> RTC[PeerJS WebRTC Mesh]
    end

    subgraph Server [Server - Node.js Monolith]
        Express[Express REST API] <--> DB[(PostgreSQL Database)]
        WSServer[WebSocket Server] <--> Rooms[Room State Manager]
        R2[R2/S3 Upload Client]
    end

    UI -- Rest HTTP Upload --> Express
    Express --> R2
    WSClient -- Room / Sync Commands --> WSServer
    RTC <-- P2P Voice & Data --> RTC
```

### WebSockets & Real-Time State Machine
The core gameplay synchronization is managed by a centralized, memory-backed WebSocket server inside the Express instance. 

*   **State Management:** Rather than persisting room sessions directly in PostgreSQL, active room states (`WaitingRoom` and `PlayingSession` interfaces) are stored in-memory using JavaScript `Map` structures. This ensures sub-millisecond response times for client synchronization packets.
*   **Game Loop Execution:** Transitions between game states (e.g., Round Start -> Option Submission -> Inter-Round Countdown -> Game Over) are orchestrated using server-side timers (`setTimeout`). Clients submit answers asynchronously, and the server tracks answer counts. If all users submit answers or vote to skip the current timer, the server clears the active timeout and advances the game state early.
*   **Network Optimization:** Communication is formatted in structured JSON packets. Every state modification broadcasts only relevant delta arrays to prevent socket congestion.

### WebRTC P2P Mesh Topology
The application implements built-in voice channels with a peer-to-peer mesh topology utilizing **PeerJS**:

```
        [Player A]  <--- WebSocket Server ---> [Player B]
            |          (Signaling / Peer IDs)      |
            |                                      |
            +------------ WebRTC Media ------------+
                      (Browser-to-Browser)
```
1.  **Signaling:** The WebSocket server functions as the signaling coordinator. When a player joins a lobby, their generated PeerJS ID is broadcasted to all connected clients in the room.
2.  **Orchestration:** Each client listens to these join events, dynamically instantiates a WebRTC connection request to the new player's ID, and hooks the incoming raw media stream into a React-recycled `<audio>` rendering component.
3.  **Scalability:** Because media streams are sent directly peer-to-peer, the server's network bandwidth is decoupled from voice streaming, ensuring the host costs remain low regardless of the active player volume.

### Similarity Quiz Computation
In Similarity Mode, the server tracks players' exact option selections across all questions in an in-memory history map (`answerHistory`). Upon completion of the final round, the server executes a pairwise comparison algorithm:

$$Similarity(A, B) = \sum_{q=1}^{N} [Answer(A, q) == Answer(B, q)]$$

From the computed pairwise correlations, the engine calculates the following social archetypes:
*   **Soulmates:** The player pair $(A, B)$ sharing the maximum similarity score.
*   **Lone Wolf:** The player whose average similarity score is the lowest relative to all other players in the room:
    $$\text{arg min}_{p} \left( \frac{1}{|P| - 1} \sum_{k \neq p} Similarity(p, k) \right)$$
*   **Most Popular Picker:** The player who chose majority options most frequently.
*   **Chaos Picker:** The player who chose unique options chosen by nobody else most frequently.

These results are delivered to the clients through a **Progressive Reveal** pattern, preventing cognitive overload and building anticipation.

