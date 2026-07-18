# Pokemon Realms — Game Design Document & Development Roadmap

> A real-time multiplayer Pokémon RPG where FireRed meets Gather Town.
> Built to be genuinely fun and technically ambitious.

---

## Table of Contents

1. [Game Vision](#1-game-vision)
2. [Core Gameplay Loop](#2-core-gameplay-loop)
3. [Technical Architecture Overview](#3-technical-architecture-overview)
4. [Development Phases](#4-development-phases)
   - [Phase 1: The Living World](#phase-1-the-living-world-foundation)
   - [Phase 2: Pokémon System](#phase-2-pokémon-system)
   - [Phase 3: Battle Engine](#phase-3-battle-engine)
   - [Phase 4: Social & Economy](#phase-4-social--economy)
   - [Phase 5: Endgame & Polish](#phase-5-endgame--polish)
   - [Phase 6: On-Chain Layer](#phase-6-on-chain-layer-optional)
5. [Technical Depth](#5-technical-depth)
6. [Milestone Checklist](#6-milestone-checklist)

---

## 1. Game Vision

Pokemon Realms is not a clone. It's a **persistent, shared world** where hundreds of players coexist on the same map — walking through towns, exploring tall grass, catching Pokémon, battling each other, trading, forming guilds, and running their own gyms. Think of it as:

- **FireRed's soul** — grid-based movement, turn-based battles, Pokémon collection, gym progression
- **Gather Town's multiplayer** — see everyone moving in real time, walk up to someone and interact
- **Unique twists** — procedural Pokémon genetics, player-run gyms, live-spectated battles, spatial audio

**The feeling we're designing for:** You log in, walk around a living world, see other trainers walking by, challenge someone to a battle right there on the map, catch a rare Pokémon with a unique genetic mutation, breed it, trade the offspring, and climb the leaderboard — all without ever leaving the browser tab.

---

## 2. Core Gameplay Loop

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   EXPLORE ──► ENCOUNTER ──► BATTLE ──► REWARD       │
│     │              │            │          │        │
│     │         Wild Pokémon    Win/Lose   XP, Items  │
│     │         Player PvP     Catch       Pokédollars│
│     │         NPC Trainer    Flee        Reputation  │
│     │                                     │        │
│     ◄─────────── PROGRESS ◄───────────────┘        │
│     │                                               │
│     │   Level up Pokémon, unlock new areas,         │
│     │   evolve, breed, challenge gyms,              │
│     │   climb leaderboards, trade                   │
│     │                                               │
│     └───────────► SOCIALIZE                         │
│           Chat, trade, form guilds,                 │
│           spectate battles, run gyms                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Why it's fun:**
- **Short sessions**: Walk around, catch a Pokémon, battle someone — 10 minutes and you progressed.
- **Long sessions**: Breed for perfect IVs, grind gym challenges, theory-craft team compositions.
- **Social pull**: Seeing other players makes the world feel alive. Spectating battles creates community.
- **Collection drive**: 151+ Pokémon with genetic variation means no two are identical.

---

## 3. Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  React UI    │  │   Phaser 3       │  │  Zustand      │  │
│  │  (Overlay)   │◄─┤   (Canvas)       │◄─┤  (Store)      │  │
│  │              │  │                  │  │               │  │
│  │  - Menus     │  │  - Tiled Maps    │  │  - Player     │  │
│  │  - Chat      │  │  - Sprites       │  │  - Pokémon    │  │
│  │  - Inventory │  │  - Animations    │  │  - Inventory  │  │
│  │  - Battle UI │  │  - Particles     │  │  - Battle     │  │
│  │  - Trade     │  │  - Camera        │  │  - UI State   │  │
│  └──────┬───────┘  └────────┬─────────┘  └───────┬───────┘  │
│         │                   │                     │          │
│         └───────────────────┴──────────┬──────────┘          │
│                                        │                     │
│                          NetworkManager (Singleton)          │
│                                        │                     │
│                              WebSocket │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                              ┌──────────┴──────────┐
                              │  Colyseus Server    │
                              │                     │
                              │  ┌───────────────┐  │
                              │  │ WorldRoom     │  │
                              │  │ BattleRoom    │  │
                              │  │ TradeRoom     │  │
                              │  └───────┬───────┘  │
                              │          │          │
                              │  ┌───────┴───────┐  │
                              │  │ Game Logic    │  │
                              │  │ - Movement    │  │
                              │  │ - Collision   │  │
                              │  │ - Encounters  │  │
                              │  │ - Battle Sim  │  │
                              │  │ - Damage Calc │  │
                              │  └───────┬───────┘  │
                              │          │          │
                              │  ┌───────┴───────┐  │
                              │  │ PostgreSQL    │  │
                              │  │ Redis         │  │
                              │  └───────────────┘  │
                              └─────────────────────┘
```

**Data flow is always:** Input → Server validates → Server updates state → Delta sync to clients → Render

---

## 4. Development Phases

---

### Phase 1: The Living World (Foundation)

**Goal:** A beautiful, explorable world with solid multiplayer movement and collision.

#### M1.0 — Multiplayer Movement ✅ DONE
- [x] Monorepo scaffold (Turborepo + npm workspaces)
- [x] Colyseus WorldRoom with server-authoritative movement
- [x] Phaser client rendering players as colored boxes
- [x] React HUD overlay with connection status
- [x] Shared types package between client/server
- [x] Client-side interpolation (lerp)

#### M1.1 — Tiled Map Integration
**What:** Replace the green grid with a real Tiled map. Multiple layers (ground, decoration, collision, above-player).

**Technical highlights:**
- Load `.tmj` (Tiled JSON) maps via Phaser's tilemap API
- Parse collision layer server-side to build a **collision grid** (2D boolean array)
- Server validates every movement against the collision grid — prevents wall-hacking
- Implement **camera follow** with smooth lerp, locked to map bounds
- Support multiple tilesets composited into one map

**Files to create:**
- `apps/server/src/maps/MapManager.ts` — loads map JSON, builds collision grid
- `apps/server/src/maps/collisionGrid.ts` — spatial lookup for walkable tiles
- `apps/client/src/game/scenes/WorldScene.ts` — refactor to load Tiled tilemap
- `packages/shared/src/maps.ts` — map metadata types
- `assets/maps/pallet-town.tmj` — first map

Server-authoritative collision detection from Tiled data enforces the security boundary — clients can never walk through walls regardless of what they send.

#### M1.2 — Animated Sprite System
**What:** Replace boxes with proper animated player sprites. 4-directional walk cycles (idle, walk). Smooth grid-snapped movement.

**Technical highlights:**
- Sprite atlas system with configurable frame dimensions
- **Grid-based movement with tweening** — player presses arrow, character smoothly walks one tile (32px) over ~200ms, can't input again until tween completes
- Server tracks tile coordinates (not pixel), client handles the visual tween
- Direction-aware idle frames
- Other players interpolate smoothly between tile positions

**Files to create:**
- `apps/client/src/game/entities/PlayerSprite.ts` — encapsulates sprite, animations, tween logic
- `apps/client/src/game/entities/RemotePlayerSprite.ts` — other players with interpolation
- `assets/sprites/player.png` — sprite sheet

Grid-based movement with client-side prediction and server reconciliation keeps the game feeling responsive even on high-latency connections.

#### M1.3 — Zone Transitions & Room Instancing
**What:** Multiple maps (Pallet Town, Route 1, Viridian City). Walking to a map edge transitions you to the next zone. Each zone is a separate Colyseus Room instance.

**Technical highlights:**
- **Room instancing** — each map is a Colyseus room. When a player reaches a zone boundary, server sends a `ZONE_TRANSFER` message, client leaves the current room and joins the new one
- Spawn points per zone (which tile you appear on when entering from each direction)
- Player count per zone visible on a minimap
- Rooms auto-dispose when empty, auto-create when needed

**Files to create:**
- `apps/server/src/rooms/ZoneManager.ts` — manages room lifecycle per zone
- `apps/server/src/maps/zoneDefinitions.ts` — zone graph (which zones connect where)
- `packages/shared/src/zones.ts` — zone IDs, spawn points, boundary definitions

Room instancing lays the groundwork for horizontal scaling — zone rooms can be distributed across multiple server processes.

#### M1.4 — NPCs & Dialog System
**What:** Static NPCs placed on maps via Tiled object layers. Walk up and press Space to trigger a dialog box.

**Technical highlights:**
- NPCs defined in Tiled as object layer points with custom properties (name, dialog lines, sprite)
- Dialog UI is a React component overlaying the canvas — typewriter text effect, choices
- Interaction radius check (must be 1 tile adjacent + facing the NPC)
- Server validates interaction (prevents remote dialog triggering)

**Files to create:**
- `apps/client/src/game/entities/NPC.ts` — NPC sprite with interaction zone
- `apps/client/src/ui/DialogBox.tsx` — React dialog component
- `apps/server/src/npcs/NPCManager.ts` — NPC positions + dialog data
- `packages/shared/src/dialog.ts` — dialog tree types

---

### Phase 2: Pokémon System

**Goal:** Catchable, trainable, evolvable Pokémon with genetic variation.

#### M2.1 — Pokémon Data & Pokédex
**What:** Implement the original 151 Kanto Pokémon. Each has base stats, types, learnable moves, evolution chains.

**Technical highlights:**
- Data-driven Pokémon definitions in JSON — no hardcoded stats
- **Type system:** 18 types with a full effectiveness matrix (2D lookup table)
- Each Pokémon species has: HP, ATK, DEF, SP.ATK, SP.DEF, SPEED base stats
- Move database: 150+ moves with categories (Physical, Special, Status), power, accuracy, PP, effects
- Evolution triggers: level-based, item-based, trade-based

**Files to create:**
- `packages/shared/src/pokemon/species.ts` — species definitions
- `packages/shared/src/pokemon/moves.ts` — move database
- `packages/shared/src/pokemon/types.ts` — type effectiveness matrix
- `apps/server/src/data/species.json` — species data
- `apps/server/src/data/moves.json` — move data

#### M2.2 — Wild Encounters & Catching
**What:** Walking on grass tiles triggers random encounters. A wild Pokémon appears. You can battle or flee. Catching uses a capture probability formula.

**Technical highlights:**
- **Encounter rate system:** Each grass tile has an encounter table (which Pokémon spawn, at what levels, with what rarity). Defined in Tiled object layer properties
- Server rolls the encounter — client never knows the encounter table (prevents cheating)
- **Catch rate formula:** Based on Pokémon HP %, status effects, Poké Ball type. Implements the actual Gen III catch formula: `catch = (3 * maxHP - 2 * currentHP) * rate * ball / (3 * maxHP) * status`
- Shake animation with suspense (1-3 shakes before catch/fail)
- Uses a separate `BattleRoom` — server creates it on encounter, both players (or player + server AI) join

Server-authoritative RNG ensures clients can't manipulate catch outcomes — all probability rolls happen server-side.

#### M2.3 — Procedural Pokémon Genetics (★ Showcase Feature)
**What:** Every individual Pokémon has a hidden genome — 6 IVs (one per stat) that modify its base stats. When two Pokémon breed, genetics recombine with mutation chances, producing genuinely unique offspring.

**Technical highlights:**
- **Individual Values (IVs):** Each stat gets a gene from 0-31 (5 bits). Total genome = 30 bits
- **Nature system:** 25 natures, each boosts one stat +10% and reduces another -10%
- **Breeding algorithm:**
  - Each IV is inherited from either parent (50/50) or mutated (5% chance → random 0-31)
  - Nature has 50% chance to pass from parent holding an Everstone
  - Egg moves: offspring can learn moves from the father's moveset
- **Shiny system:** 1/4096 chance based on a hash of Trainer ID XOR Pokémon personality value
- Stat calculation: `stat = floor(((2 * base + IV) * level / 100 + 5) * nature)`

**Files to create:**
- `apps/server/src/pokemon/genetics.ts` — IV generation, breeding algorithm, stat calculation
- `apps/server/src/pokemon/PokemonInstance.ts` — individual Pokémon with genome
- `packages/shared/src/pokemon/genetics.ts` — types for IVs, natures
- `apps/client/src/ui/PokemonSummary.tsx` — shows stats, nature, IV hints

This is the feature that gives the game real depth — the intersection of Mendelian genetics, probability theory, and data modeling creates emergent variation that makes every Pokémon genuinely unique.

#### M2.4 — Party & PC Storage
**What:** Player carries up to 6 Pokémon. Excess are stored in the PC (accessible from Pokémon Centers). Full CRUD on party order.

**Technical highlights:**
- **PostgreSQL schema:** `pokemon` table with foreign key to `users`, storing species_id, level, xp, IVs (JSONB), nature, moves (JSONB array), current_hp, status
- Party ordering stored as array of Pokémon IDs on the user row
- Drag-and-drop party reordering in React UI
- Server validates all party mutations (can't add 7th Pokémon, can't use a Pokémon you don't own)

**Database tables introduced:**
```sql
users (id, username, password_hash, party_order, money, badges, created_at)
pokemon (id, owner_id, species_id, nickname, level, xp, ivs, nature, moves, current_hp, status, is_shiny, ot_id)
pc_boxes (id, owner_id, box_number, slot, pokemon_id)
```

---

### Phase 3: Battle Engine

**Goal:** A complete turn-based battle system — PvE and PvP, server-authoritative, live-spectatable.

#### M3.1 — Turn-Based Battle Core
**What:** The heart of the game. A fully server-authoritative battle simulator.

**Technical highlights:**
- **BattleRoom** — a dedicated Colyseus room for each battle (2 participants + N spectators)
- **Battle state machine:**
  ```
  WAITING_FOR_ACTIONS → RESOLVING_TURN → APPLY_EFFECTS → CHECK_FAINT → 
  SWITCH_PROMPT → WAITING_FOR_ACTIONS (loop) → BATTLE_END
  ```
- **Turn resolution order:** Determined by Speed stat, modified by priority moves (Quick Attack = +1)
- **Damage formula** (Gen III inspired):
  ```
  damage = ((2*level/5 + 2) * power * atk/def) / 50 + 2) * modifier
  modifier = STAB * typeEffectiveness * critical * random(0.85, 1.0)
  ```
- Server resolves entire turn atomically — clients receive a `TurnResult` with ordered events
- **Client animation queue:** Events are played sequentially (attack animation → damage number → HP bar drain → status text)

**Files to create:**
- `apps/server/src/battle/BattleEngine.ts` — pure logic, no side effects (testable)
- `apps/server/src/battle/DamageCalculator.ts` — damage formula
- `apps/server/src/battle/TurnResolver.ts` — ordering, priority, speed ties
- `apps/server/src/rooms/BattleRoom.ts` — Colyseus room wrapping the engine
- `apps/client/src/game/scenes/BattleScene.ts` — Phaser battle rendering
- `apps/client/src/ui/BattleUI.tsx` — move selection, HP bars, party switch
- `packages/shared/src/battle.ts` — battle events, action types

The battle engine is pure logic with no side effects — fully unit-testable, and the same code path is used for PvE, PvP, and AI battles.

#### M3.2 — Status Effects & Secondary Effects
**What:** Poison, Burn, Paralysis, Sleep, Freeze, Confusion. Moves can have secondary effect chances (30% chance to burn).

**Technical highlights:**
- Status effects modify stats or deal damage per turn
- Effect resolution is part of the turn pipeline (after damage, before next turn)
- Compound probability: Paralysis (25% can't move) + Confusion (50% self-hit) stack independently
- Move secondary effects roll server-side (e.g., Flamethrower: 10% burn)

#### M3.3 — PvP Matchmaking & Challenge System
**What:** Walk up to another player, press Space to challenge. They see a prompt. Both accept → BattleRoom created. Or queue for ranked matchmaking.

**Technical highlights:**
- **Challenge protocol:** Challenger sends request → target receives prompt → accept/decline → server creates BattleRoom → both clients transition to BattleScene
- **Ranked matchmaking:** Elo-based rating system stored in PostgreSQL. Server runs a matchmaking queue (Redis sorted set by Elo ± range, expanding over time)
- **Anti-disconnect:** If a player disconnects mid-battle, they auto-forfeit after 30s. Elo adjusted.

#### M3.4 — Live Battle Spectating (★ Showcase Feature)
**What:** Anyone can spectate an ongoing battle. Walk up to battling players and press S to watch. See the battle in real-time with a chat sidebar.

**Technical highlights:**
- **Spectator mode in BattleRoom:** Spectators join the same Colyseus room with a `spectator` role. They receive all `TurnResult` events but cannot send actions
- Spectator count shown above battling players' heads on the world map
- **Live chat** in spectator view — React chat panel with message rate limiting
- Battle replay system: all `TurnResult` events are logged. Can be replayed later via a replay viewer
- Server streams 5-10 "hot" battles to a lobby list (most spectators, highest Elo)

Live spectating turns every battle into a social event, and the replay system creates content that outlives the match.

---

### Phase 4: Social & Economy

**Goal:** Players interact, trade, form communities, and build the in-game economy.

#### M4.1 — Authentication & Persistence
**What:** Account creation, login, persistent player data across sessions.

**Technical highlights:**
- **JWT auth** with refresh tokens. Access token in memory, refresh in httpOnly cookie
- **Password hashing** with bcrypt (cost factor 12)
- PostgreSQL user table with Drizzle ORM
- Session recovery: if you refresh the browser, JWT auto-reconnects you to your last zone with your party intact
- Rate limiting on auth endpoints (express-rate-limit)

#### M4.2 — Chat System
**What:** Global chat, zone chat, whisper (DM), and party chat. Chat appears in a React panel.

**Technical highlights:**
- Chat messages routed through Colyseus room messages (zone-scoped by default)
- **Proximity chat option:** Messages typed without a prefix only appear to players within 5 tiles
- Whisper: `/w username message`
- Chat history stored in Redis (last 100 messages per zone, TTL 1 hour)
- Profanity filter using a trie-based word matcher (no regex for performance)
- Messages rendered in a virtualized list (react-window) to handle high volume

#### M4.3 — Trading System
**What:** Walk up to a player, initiate a trade. Both players see a trade window. Drag Pokémon and items in. Both must confirm. Server validates and swaps atomically.

**Technical highlights:**
- **TradeRoom** — dedicated Colyseus room for 2 players
- **Two-phase confirmation:** Both players add Pokémon/items → both press "Ready" → both press "Confirm" → server executes atomic swap in a PostgreSQL transaction
- Server validates ownership of all Pokémon/items before executing
- Trade history logged for dispute resolution
- GTS (Global Trade Station): post a Pokémon with a "looking for" request. Async matching via a Redis search index

#### M4.4 — Player-Run Gyms (★ Showcase Feature)
**What:** Any player who owns 8 badges can found a Gym. The gym appears as a building on the world map. Challengers queue up. The gym leader battles them in sequence. Win streaks earn the leader rewards and fame.

**Technical highlights:**
- **Gym as a persistent entity** in PostgreSQL: owner, location (zone + tile), type specialty, badge name, reward money
- Gym appears on the Tiled map as a dynamic object (server tells clients where gyms exist)
- **Challenge queue:** Redis list. Challengers join the queue. Server pops them one at a time into a BattleRoom with the leader
- Leader sets their team of 6 (locked when gym is "open")
- **Win streak leaderboard** per gym. Top gyms shown on a global ranking page
- If the leader logs off, gym goes to "closed" state. Challengers notified

Player-run gyms are emergent social infrastructure — the technical implementation involves dynamic map objects, persistent entities, queue management, and real-time state transitions.

---

### Phase 5: Endgame & Polish

**Goal:** Depth for hardcore players, polish for everyone, and infrastructure for scale.

#### M5.1 — Evolution & Items
**What:** Pokémon evolve at certain levels or with items (Fire Stone, Thunder Stone, etc.). Items can be found, bought, or earned.

**Technical highlights:**
- Evolution triggers checked server-side after XP gain
- Evolution animation in Phaser (white flash, sprite morph tween)
- Item inventory with categories (Held Items, Consumables, Key Items, Poké Balls)
- Held items affect battle (e.g., Charcoal boosts Fire moves by 20%)
- Server-authoritative item validation (can't use an item you don't have)

#### M5.2 — NPC Trainers & Gym Leader AI
**What:** NPC trainers on routes challenge you. 8 official Gym Leaders with increasing difficulty. Each has a scripted team and basic AI.

**Technical highlights:**
- **Battle AI — Minimax with heuristics:**
  - AI evaluates each possible move using a scoring function
  - Score considers: type effectiveness, remaining HP ratio, status advantages, switching value
  - Difficulty levels: Easy (random), Medium (greedy best move), Hard (2-ply minimax with alpha-beta pruning)
  - Gym Leaders use Hard AI with hand-tuned teams
- AI runs entirely server-side within the BattleEngine — same code path as PvP

The AI runs the same BattleEngine code path as PvP — it's just another "player" making decisions, which keeps the architecture clean.

#### M5.3 — Breeding & Daycare
**What:** Leave two compatible Pokémon at the Daycare. After walking N steps, an Egg appears. Hatch it by walking more.

**Technical highlights:**
- Egg Group compatibility matrix (server-validated)
- Step counter tracked server-side (each tile movement increments)
- Egg generation uses the genetics system from M2.3
- Hatch animation + "Oh? Your Egg is hatching!" reveal screen

#### M5.4 — Leaderboards & Achievements
**What:** Global leaderboards (PvP Elo, Pokédex completion, gym win streaks). Achievement system with badges.

**Technical highlights:**
- Leaderboards stored in Redis sorted sets (O(log N) insert/rank lookup)
- Achievements as a bitfield per player (space efficient: 64 achievements = 8 bytes)
- Achievement unlock triggers are event-driven (pub/sub pattern on the server)
- Profile card component showing badges, stats, top Pokémon

#### M5.5 — Spatial Audio & Ambience (★ Showcase Feature)
**What:** Hear ambient sounds based on your location. Grass rustles in tall grass. Water flows near rivers. Other players' footsteps fade with distance.

**Technical highlights:**
- **Web Audio API** with spatial panning (PannerNode)
- Audio zones defined in Tiled as polygon objects with audio properties (src, volume, loop)
- Distance-based volume falloff: `volume = 1 / (1 + distance * 0.1)`
- Footstep sounds vary by terrain type (grass, stone, sand, water)
- Optional proximity voice chat via WebRTC (PeerJS for signaling)

Spatial audio tied to tile-map data bridges the gap between game design tools (Tiled), client-side APIs (Web Audio), and real-time spatial computation — making the world feel alive even before you look at the screen.

#### M5.6 — Infrastructure & Scaling
**What:** Prepare the game for >1000 concurrent players.

**Technical highlights:**
- **Horizontal scaling:** Each Colyseus server handles N zone rooms. A Redis-backed presence service routes players to the correct server
- **Database connection pooling** via pgBouncer
- **CDN** for static assets (maps, sprites, audio)
- **Rate limiting** on all WebSocket messages (token bucket per client)
- **Monitoring:** Prometheus metrics + Grafana dashboards (rooms active, players online, message throughput, p99 latency)
- **CI/CD:** GitHub Actions pipeline — lint, type-check, test, build, deploy to a VPS via Docker Compose
- **Load testing:** Artillery.io script simulating 500 concurrent WebSocket connections

---

### Phase 6: On-Chain Layer (Optional)

**Goal:** Add a blockchain layer that solves real problems traditional backends can't — verifiable ownership, trustless trading, and cross-server portability. The game works perfectly without it. Connecting a wallet unlocks additional capabilities.

**Design philosophy:** Web3 here is not a gimmick. It solves three specific problems:
1. **Trust in trades** — a smart contract escrow removes the need to trust the game server during high-value trades
2. **Provenance** — a Pokémon's entire breeding lineage is immutable and publicly auditable
3. **Portability** — if someone forks and hosts their own Pokemon Realms server, your Pokémon can travel with you because ownership lives on-chain, not in any single database

#### M6.1 — Wallet Auth (Sign-In With Ethereum)
**What:** Players can optionally link an EVM wallet to their account. Login via signature challenge (EIP-4361 / SIWE) — no password needed for wallet-linked accounts.

**Technical highlights:**
- **SIWE flow:** Server generates a nonce → client signs with wallet → server verifies signature → issues JWT
- Wallet address stored alongside the user record in PostgreSQL. One wallet = one account (enforced)
- Wallet linking is optional — email/password auth still works. This is additive, not a gate
- Uses ethers.js v6 on the client, viem on the server for signature verification

**Files to create:**
- `apps/server/src/auth/siwe.ts` — nonce generation, signature verification
- `apps/client/src/ui/WalletConnect.tsx` — wallet connection UI (MetaMask, WalletConnect)
- `packages/shared/src/auth.ts` — auth message types

#### M6.2 — On-Chain Pokémon Registry (★ Showcase Feature)
**What:** Every Pokémon has an optional on-chain identity. When "registered," a Pokémon's genome (IVs, nature, species, OT) is hashed and stored in a smart contract. This creates a permanent, verifiable record of that Pokémon's existence and ownership.

**This is NOT an NFT marketplace.** There are no listings, no floor prices, no speculation. It's a **provenance ledger** — think certificate of authenticity, not trading card marketplace.

**Technical highlights:**
- **Smart contract (Solidity):** `PokemonRegistry.sol`
  - `registerPokemon(bytes32 genomeHash, uint16 speciesId, address owner)` — writes a record
  - `transferPokemon(uint256 tokenId, address newOwner)` — ownership transfer (only via escrow contract)
  - `getLineage(uint256 tokenId) → uint256[] parentIds` — returns breeding ancestry
  - Uses ERC-721 under the hood for ownership semantics, but the UI never calls it an "NFT"
- **Genome hash:** `keccak256(abi.encode(speciesId, ivs, nature, otId, personalityValue))` — deterministic, server can verify
- **Registration is opt-in and free** (gas paid by a relayer/meta-transaction or deployed on a low-cost L2 like Base/Arbitrum)
- Server validates that the Pokémon exists in PostgreSQL before allowing registration
- On-chain data is minimal (hash + species + owner). Full data lives in the database. The chain is the proof layer, not the storage layer

**Why this works as a design:**
- It doesn't interfere with gameplay. You never need a wallet to play
- It adds genuine value: when someone trades you a perfect IV Charizard, you can verify on-chain that it wasn't duped or edited by a rogue server admin
- The breeding lineage tree on-chain is a genuinely novel data structure — a Merkle DAG of genetic provenance

**Files to create:**
- `contracts/PokemonRegistry.sol` — Solidity contract
- `contracts/test/PokemonRegistry.test.ts` — Hardhat test suite
- `apps/server/src/chain/registryService.ts` — server-side contract interaction
- `apps/client/src/ui/PokemonRegistration.tsx` — "Register on-chain" button in Pokémon summary

#### M6.3 — Trustless Trade Escrow
**What:** High-value trades can optionally go through an on-chain escrow contract instead of trusting the game server. Both players approve the swap on-chain. The contract executes atomically.

**Technical highlights:**
- **Escrow contract:** `TradeEscrow.sol`
  - Player A calls `propose(tokenIdA, tokenIdB, counterparty)` — locks their Pokémon
  - Player B calls `accept(tradeId)` — locks theirs and executes the atomic swap
  - Either party can `cancel(tradeId)` before the other accepts
  - Timeout: if no acceptance within 10 minutes, proposer can withdraw
- Server updates PostgreSQL ownership after observing the on-chain `TradeExecuted` event (event listener)
- The game UI wraps all of this — players never interact with Etherscan. They see a trade window with a "Secure Trade (on-chain)" toggle

**Files to create:**
- `contracts/TradeEscrow.sol` — escrow contract
- `apps/server/src/chain/escrowListener.ts` — event listener syncing on-chain state to DB

#### M6.4 — Tournament Prize Pools
**What:** Ranked tournaments with staked entry fees. A smart contract holds the pool and distributes prizes based on results submitted by the server with cryptographic proof.

**Technical highlights:**
- **Tournament contract:** `Tournament.sol`
  - Players deposit entry fee (ETH or stablecoin) via `enter(tournamentId)`
  - Server submits results as a signed message: `finalizeRound(tournamentId, winner, loser, serverSignature)`
  - Contract verifies the server's signature (server address is a trusted signer set at deployment)
  - Prize distribution: winner-take-all or top-3 split, configurable per tournament
  - Emergency withdraw: if server goes offline, players can reclaim after a 24-hour timelock
- This is a legitimate DeFi escrow pattern — trustless prize distribution with server oracle verification

**Files to create:**
- `contracts/Tournament.sol` — tournament pool contract
- `apps/server/src/chain/tournamentService.ts` — result submission + signing
- `apps/client/src/ui/TournamentLobby.tsx` — tournament browser + entry

---

**Tech stack addition for Phase 6:**
- **Smart contracts:** Solidity + Hardhat (compile, test, deploy)
- **Chain:** Base L2 (low gas, EVM-compatible, Coinbase ecosystem)
- **Client:** ethers.js v6 + wagmi/viem for wallet connection
- **Server:** viem for contract reads/writes + event listening

Key systems and the engineering concepts behind them:

| Concept | Where It's Implemented |
|---------|----------------------|
| **Server-authoritative game state** | WorldRoom, BattleRoom — all game logic runs on server, clients are dumb renderers |
| **Real-time state synchronization** | Colyseus delta encoding, client-side interpolation, prediction/reconciliation |
| **State machine architecture** | Battle engine turn pipeline (WAITING → RESOLVING → EFFECTS → FAINT_CHECK → loop) |
| **Procedural generation + probability** | Pokémon genetics (IVs, breeding, mutation), catch rate formula, encounter tables |
| **Minimax AI with alpha-beta pruning** | NPC battle AI evaluating move trees with heuristic scoring |
| **WebSocket room management** | Zone instancing, battle rooms, trade rooms, spectator roles |
| **Pub/Sub event system** | Achievement triggers, battle events, zone broadcasts |
| **Relational data modeling** | PostgreSQL schema — users, pokémon, items, gyms, trades with proper foreign keys and indexes |
| **Caching layer** | Redis for sessions, leaderboards (sorted sets), chat history, matchmaking queues |
| **Client architecture** | React + Phaser decoupled via Zustand store — clean separation of rendering and UI |
| **Spatial computation** | Collision grids from Tiled, proximity chat, spatial audio distance falloff |
| **Auth & security** | JWT + refresh tokens, bcrypt, rate limiting, input validation, anti-cheat on movement/battles |
| **Monorepo & shared types** | Turborepo with shared TypeScript package — single source of truth |
| **CI/CD & monitoring** | GitHub Actions, Docker, Prometheus/Grafana, load testing |
| **Smart contract design** | Solidity escrow patterns, ERC-721 Pokémon provenance registry, server-oracle tournament pools |
| **Web3 integration** | SIWE auth, meta-transactions, on-chain event listeners syncing to PostgreSQL |

---

## 6. Milestone Checklist

### Phase 1: The Living World
- [x] **M1.0** Multiplayer movement (server-authoritative boxes)
- [x] **M1.1** Tiled map integration + server collision detection
- [x] **M1.2** Animated player sprites with grid-based tweened movement
- [x] **M1.3** Zone transitions + room instancing
- [x] **M1.4** NPCs + dialog system

### Phase 2: Pokémon System
- [x] **M2.1** Pokémon species data + type effectiveness matrix
- [x] **M2.2** Wild encounters + catch mechanics
- [x] **M2.3** Procedural Pokémon genetics (IVs, natures, shinies)
- [x] **M2.4** Party management + PC storage (PostgreSQL)

### Phase 3: Battle Engine
- [x] **M3.1** Turn-based battle core (state machine + damage formula)
- [x] **M3.2** Status effects + secondary move effects
- [x] **M3.3** PvP challenge + Elo matchmaking
- [x] **M3.4** Live battle spectating + replay system

### Phase 4: Social & Economy
- [x] **M4.1** Auth (JWT + bcrypt) + session persistence
- [x] **M4.2** Chat system (zone, proximity, whisper)
- [x] **M4.3** Trading system (live + GTS)
- [x] **M4.4** Player-run gyms

### Phase 5: Endgame & Polish
- [ ] **M5.1** Evolution + item system
- [ ] **M5.2** NPC trainers + gym leader AI (minimax)
- [ ] **M5.3** Breeding + daycare
- [ ] **M5.4** Leaderboards + achievements
- [ ] **M5.5** Spatial audio + ambience
- [ ] **M5.6** Infrastructure (scaling, CI/CD, monitoring)

### Phase 6: On-Chain Layer
- [ ] **M6.1** Wallet auth (SIWE)
- [ ] **M6.2** On-chain Pokémon registry (provenance ledger)
- [ ] **M6.3** Trustless trade escrow
- [ ] **M6.4** Tournament prize pools

---

## Next Step

Currently at **Phase 4 complete**. Next up: **Phase 5 — Endgame & Polish** — adding evolution, items, NPC battle AI, breeding, achievements, and scaling infrastructure.
