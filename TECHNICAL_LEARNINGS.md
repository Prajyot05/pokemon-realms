# Technical Learnings & Concepts: Pokemon Realms

This document serves as a living knowledge base for the advanced technical concepts, architectural decisions, and networking strategies used in this project. 

## Instructions for Adding Future Concepts
When adding new concepts to this document, please adhere to the following format:
1. **Append to the list** using numbered points to maintain chronological order of learnings.
2. **Title the concept** clearly.
3. **Provide context**: Briefly explain *why* the concept was needed or what problem it solves.
4. **Deep Dive**: Explain *how* it works under the hood in the context of this specific project.
5. **Code References**: Mention which files or systems are heavily involved (e.g., `WorldScene.ts`, `NetworkManager.ts`).

---

## 1. Client-Side Prediction (CSP) & Server Reconciliation
**The Problem**: In a strictly server-authoritative game, players send a movement command to the server and must wait for the server to update their position and send it back before their character moves on screen. This delay (Round Trip Time or "ping") makes the game feel sluggish and unresponsive.
**The Solution**: 
- **Prediction**: When the local player presses a movement key (e.g., Arrow Right), the client *optimistically* applies the `MOVE_SPEED` to the sprite locally and plays the walking animation instantly. The client assumes the move is legal and doesn't wait for the server.
- **Reconciliation**: The server is still the absolute source of truth. When the client receives a position update from the server, it compares its predicted local position against the server's authoritative position using `Phaser.Math.Distance.Between`. If the divergence is larger than an acceptable threshold (e.g., 32 pixels / 1 tile), it means the server rejected the movement (like walking into a wall), and the client instantly "snaps" the player back to the server's correct position.
**Files Involved**: `apps/client/src/game/scenes/WorldScene.ts`

## 2. Decoupling High-Frequency Physics State from React (Zustand Optimization)
**The Problem**: Colyseus synchronizes game state at a high frequency (e.g., 60 ticks per second). Initially, every single `x` and `y` coordinate change for every player was mirrored from the Colyseus `Room` state into the global React store (`Zustand`). This forced the React component tree (like the HUD) to re-render 60 times a second unnecessarily, causing massive performance overhead.
**The Solution**: We eliminated state duplication by making Phaser (the game loop) read directly from the raw Colyseus state (`networkManager.getRoom().state.players`). The React store (`Zustand`) is now only used for low-frequency UI updates, such as tracking the total `playerCount` when a user connects or disconnects, keeping the React rendering extremely performant.
**Files Involved**: `apps/client/src/stores/useGameStore.ts`, `apps/client/src/game/network/NetworkManager.ts`

## 3. ESBuild Class Field Semantics vs Colyseus Decorators
**The Problem**: Colyseus relies heavily on TypeScript decorators (e.g., `@type('string')`) to define its network schemas for serialization/deserialization. When targeting `ES2022` in `tsconfig.json`, modern TypeScript/ESBuild defaults to using ECMAScript standard class fields (`useDefineForClassFields: true`). This compiles class properties using `Object.defineProperty` directly on the instance, which unfortunately shadows and completely breaks the custom getters and setters injected by Colyseus' `@type` decorators onto the class prototype. This results in the client silently failing to decode maps and arrays from the server payload.
**The Solution**: We explicitly set `"useDefineForClassFields": false` in the root `tsconfig.base.json`. This forces ESBuild (which powers Vite) to use legacy compilation for class properties (simple assignment), allowing the Colyseus schema decorators to function correctly and successfully synchronize complex data structures like `MapSchema`.
**Files Involved**: `tsconfig.base.json`, `packages/shared/src/schemas/PlayerSchema.ts`

## 4. `MapSchema.onAdd` Timing and Initial State
**The Problem**: In Colyseus 0.14+, when you connect to a room using `await joinOrCreate(...)`, the promise resolves *after* the initial state has already been synchronized. This means if you attach a `.onAdd` listener to a collection *after* the await, it will only fire for players who join in the future, completely missing the players (including yourself) that are already in the room.
**The Solution**: Immediately after registering the `.onAdd` listener, we must manually iterate over the collection using `.forEach()` to process the initial items that were already present in the room state at the time of connection.
**Files Involved**: `apps/client/src/game/network/NetworkManager.ts`

## 5. Strict Type Sharing Across the Network Boundary
**The Problem**: When passing data across the network, complex TypeScript unions (like `'up' | 'down' | 'left' | 'right'`) are degraded to raw `string` primitives by the Colyseus schema. When the client receives this state, accessing it requires dangerous `as any` casts to satisfy the compiler.
**The Solution**: We implemented a Type Guard (`isValidDirection`) in the shared types package. This function safely checks if an incoming raw string matches the strict literal union, allowing TypeScript to narrow the type securely at runtime on the client, eliminating unsafe casting and preventing potential runtime bugs caused by invalid network payloads.
**Files Involved**: `packages/shared/src/index.ts`, `apps/client/src/game/scenes/WorldScene.ts`

## 6. Phaser 3 Tiled Integration (Embedded Tilesets)
**The Problem**: Tiled Map Editor allows exporting maps as `.tmj` (JSON) and referencing external tileset files (`.tsj`). However, when attempting to load these into Phaser 3 using `this.load.tilemapTiledJSON()`, the client would crash and display a black screen because Phaser 3's built-in Tiled parser does not recursively fetch external `.tsj` files.
**The Solution**: We modified our custom map generation script to embed the tileset data directly into the `.tmj` JSON structure instead of using an external source reference. This allows Phaser to parse the entire map and tileset definitions in a single pass.
**Files Involved**: `scripts/create-sample-map.ts`, `apps/client/src/game/scenes/WorldScene.ts`

## 7. Server-Authoritative Collision Grids via Tiled
**The Problem**: To prevent cheating and ensure all clients agree on the game state, collision detection cannot happen purely on the client. The server needs to know where walls, trees, and obstacles are without running a full heavy physics engine or a headless browser.
**The Solution**: We built a lightweight `CollisionGrid` system on the server. When a zone is created, the server loads the exact same `.tmj` map file the client uses, parses the `Foreground` layer data, and constructs a highly efficient 2D boolean array. When a player attempts to move, the server calculates their next tile coordinate `(x / 32, y / 32)` and checks the boolean grid in O(1) time to approve or reject the movement.
**Files Involved**: `apps/server/src/maps/CollisionGrid.ts`, `apps/server/src/maps/MapManager.ts`, `apps/server/src/rooms/WorldRoom.ts`
