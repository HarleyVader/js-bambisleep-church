# BambiSleep Church

A real-time community chat application for BambiSleep, built with Express.js, Socket.IO, and MongoDB. Features a progressive XP and levelling system, Patreon supporter integration, BambiCloud audio streaming, and a vibrance toy control panel.

## Features

- **Real-time chat** — Socket.IO-powered messaging with emoji reactions
- **XP & levelling system** — Earn XP for messages, session time, daily visits, and reactions received; level up through 10 tiers with prestige beyond level 10
- **Procedural avatars** — Auto-generated sprite avatars that evolve with your level; unlockable palettes, decorations (glow, crown, halo), and titles
- **Patreon integration** — OAuth 2.0 popup flow; active patrons unlock exclusive audio tracks
- **BambiCloud audio** — Server-side playlist fetching and secure range-request proxy stream from `cdn.bambicloud.com`
- **Buttplug.io panel** — In-browser toy control via the Buttplug.io WebSocket protocol
- **User accounts** — Session-token-based identity stored in MongoDB; no passwords required

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Real-time | Socket.IO 4 |
| Database | MongoDB + Mongoose 9 |
| Auth | Patreon OAuth 2.0 |
| Frontend | Vanilla JS + CSS |

## Project Structure

```
js-bambisleep-church/
├── src/
│   ├── app.js                  # Express app, middleware, route mounting
│   ├── server.js               # HTTP server entry point, Socket.IO init
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── xpConfig.js         # XP rates, level thresholds, unlock table
│   ├── controllers/
│   │   ├── chatController.js   # Message send/fetch logic
│   │   └── userController.js   # User registration and lookup
│   ├── models/
│   │   ├── Message.js          # Mongoose message schema
│   │   └── User.js             # Mongoose user schema (XP, avatar, Patreon)
│   ├── routes/
│   │   ├── audio.js            # BambiCloud playlist fetch + stream proxy
│   │   ├── chat.js             # Chat REST endpoints
│   │   ├── patreon.js          # Patreon OAuth, webhook, status, unlink
│   │   ├── reactions.js        # Emoji reaction endpoints
│   │   └── user.js             # User registration/session endpoints
│   ├── sockets/
│   │   └── chatSocket.js       # Socket.IO event handlers
│   └── utils/
│       ├── avatarGenerator.js  # Procedural sprite generation
│       ├── logger.js           # Winston/console logger
│       └── xpService.js        # XP calculation, level-up, prestige logic
├── public/
│   ├── index.html              # Single-page app shell
│   ├── style.css               # Global styles
│   ├── chat.js                 # Chat UI + Socket.IO client
│   ├── audio-player.js         # BambiCloud audio player UI
│   ├── buttplug-panel.js       # Buttplug.io toy control panel
│   ├── patreon.js              # Patreon status panel + OAuth popup
│   └── avatars/                # Static avatar sprite assets
├── .env.example                # Environment variable template
├── package.json
└── bambisleepchurch.service    # systemd service unit
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- A Patreon developer app (optional — only needed for patron features)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/HarleyVader/js-bambisleep-church.git
   cd js-bambisleep-church
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy and configure the environment file:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `MONGODB_URI` | MongoDB connection string |
   | `PORT` | HTTP port (default `3000`) |
   | `SECRET_KEY` | Secret used for session signing |
   | `NODE_ENV` | `development` or `production` |
   | `PATREON_CLIENT_ID` | From the Patreon developer portal |
   | `PATREON_CLIENT_SECRET` | From the Patreon developer portal |
   | `PATREON_REDIRECT_URI` | Must match exactly — e.g. `https://bambisleep.church/auth/patreon/callback` |
   | `PATREON_CAMPAIGN_ID` | Your creator campaign ID |
   | `PATREON_WEBHOOK_SECRET` | Secret returned when creating a Patreon webhook |
   | `APP_BASE_URL` | Public base URL, e.g. `https://bambisleep.church` |

## Usage

**Development** (auto-restart on file changes):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server listens on `http://localhost:<PORT>`.

## Patreon OAuth Setup

1. Create a client at [patreon.com/portal/registration/register-clients](https://www.patreon.com/portal/registration/register-clients)
2. Set the redirect URI to `https://<your-domain>/auth/patreon/callback`
3. Fill in `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET`, and `PATREON_REDIRECT_URI` in `.env`
4. Create a webhook pointing to `https://<your-domain>/api/patreon/webhook` and set `PATREON_WEBHOOK_SECRET`

## Deploying with systemd

A `bambisleepchurch.service` unit file is included. Copy it to `/etc/systemd/system/`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bambisleepchurch
```

## XP & Level System

| Level | Title | XP Required |
|---|---|---|
| 1 | Bambi Bud | 0 |
| 2 | Bambi Babe | 50 |
| 3 | Bambi Belle | 150 |
| 4 | Bambi Bloom | 300 |
| 5 | Bambi Bliss | 500 |
| 6 | Bambi Bright | 750 |
| 7 | Bambi Star | 1 050 |
| 8 | Bambi Diva | 1 400 |
| 9 | Bambi Angel | 1 800 |
| 10 | Bambi Goddess | 2 250 → Prestige |

XP is earned by sending messages (+1 per message, +1 per 10 words), staying in session (+1 per 5 min, capped at 3 hours), first activity of the day (+5), and receiving reactions (+2 each).

## Contributing

Pull requests and issues are welcome.