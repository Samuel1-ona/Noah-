# Noah Lucky Vault — Frontend API Demo 🎲

A browser-based dice game that demonstrates **every Noah backend API endpoint** in a live, interactive UI. No smart contract, no MetaMask required for the game — the primary goal is to exercise and test the Noah Protocol backend you built.

---

## What this demo covers

| Endpoint | Method | What it tests |
|---|---|---|
| `/health` | GET | Backend liveness + relayer wallet balance |
| `/relayer/status` | GET | Relayer address + ETH balance (auth-protected) |
| `/identity/status/:address` | GET | Noah KYC registration check — **gates the game** |
| `/identity/nullifier/:address` | GET | Deterministic nullifier derivation |
| `/protocol/requirements/:address` | GET | On-chain KYC age requirement |
| `/protocol/access/check` | POST | Per-user protocol access check |
| `/protocol/requirements` | POST | Set `minAge` requirement (auth-protected) |

Every request is shown in the **HTTP Request Log** pane with method, status, latency, and the full request/response body — so you can see the API working in real time.

---

## Quick start

### 1 — Start the Noah backend

```bash
cd ../../backend
cp .env.example .env    # fill in RELAYER_PRIVATE_KEY, API_KEY, RPC_URL
npm install
npm run build
npm start
```

Backend runs at `http://localhost:3000`.

### 2 — Open the game

Just open the file directly in your browser — no build step needed:

```
Noah/Examples/NoahGame/frontend/index.html
```

Or serve it with any static server:

```bash
npx serve Noah/Examples/NoahGame/frontend
```

### 3 — Use the demo

1. **API base URL** — defaults to `http://localhost:3000/api/v1`. Change it in the header if your backend runs elsewhere.
2. **Enter an Ethereum address** — paste a `0x…` address in the sidebar input, or click 🦊 to pull it from MetaMask automatically.
3. **Check KYC status** — click `GET /identity/status/:address`. If the address is Noah-registered, the game unlocks immediately.
4. **Play** — pick a die face (⚀–⚅), choose a bet size, hit Roll. Results appear in the game pane and the stats pane tracks your session.
5. **Fire other endpoints** — click any button in the sidebar, or use the **API Explorer** pane to build and send a custom request with any method, path, body, and API key.
6. **HTTP log** — every request appears in the bottom-right pane. Click any entry to re-load the request/response in the explorer.

---

## Game rules (simulated, no on-chain state)

| Outcome | Condition | Payout |
|---|---|---|
| 🏆 Jackpot | Exact die match | 5× bet |
| 🎯 Near miss | ±1 off (1 ↔ 6 wrap) | 1.5× bet |
| 💨 Miss | Everything else | Lose bet |

You start with 10,000 coins. The game re-checks your KYC status every 3 rolls to keep the API traffic flowing.

---

## Noah integration flow

```
User enters address
        │
        └─► GET /api/v1/identity/status/:address
                 │
                 ├── isRegistered: true  → game unlocks, dice active
                 └── isRegistered: false → overlay stays, "not verified" shown

Every 3 rolls:
        └─► silent re-check of /identity/status/:address
            (keeps API activity visible in the log)
```

The API key field in the explorer panel unlocks the auth-protected routes (`/relayer/status`, `POST /protocol/requirements`). Set it to the `API_KEY` value from your backend `.env`.

---

## File structure

```
NoahGame/
├── frontend/
│   └── index.html    ← entire demo in one self-contained file
└── README.md
```
