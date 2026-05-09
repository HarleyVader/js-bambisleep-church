# BambiSleep Church

A real-time community chat application for BambiSleep, built with Express.js, Socket.IO, and SQLite. Features a progressive XP and levelling system, Patreon supporter integration, BambiCloud audio streaming, and a remote-capable Buttplug.io toy control panel.

## Features

- **Real-time chat** — Socket.IO-powered messaging with emoji reactions and image / video attachments
- **XP & levelling system** — Earn XP for messages, session time, daily visits, and reactions; level up through 10 tiers with prestige beyond level 10
- **Profile card** — Live left-column identity card showing username, level badge, XP bar, role, status, and a 2×2 stats grid; updates in real time
- **Patreon integration** — OAuth 2.0 popup flow inside the profile card; linked patrons display avatar thumbnail, name, and tier badge
- **BambiCloud audio** — Server-side playlist fetching and secure range-request proxy stream from `cdn.bambicloud.com`, with optional toy-vibration sync to playback
- **Buttplug.io toy control** — Standalone "Toy Connection" panel for the local Intiface WebSocket, plus a username-hover modal of haptic patterns. Hovering **another user's** name routes pattern / All Vibrate / All Stop actions through the chat socket to **their** device
- **Anonymous accounts** — Session-token-based identity stored in SQLite; no passwords required

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Real-time | Socket.IO 4 |
| Database | SQLite (`better-sqlite3`) |
| Auth | Patreon OAuth 2.0 |
| Frontend | Vanilla JS + modular CSS |

## Project Structure

```
js-bambisleep-church/
├── src/
│   ├── app.js                  # Express app, middleware, route mounting
│   ├── server.js               # HTTP server entry point, Socket.IO init
│   ├── config/
│   │   ├── sqlite.js           # SQLite connection + schema bootstrap
│   │   └── xpConfig.js         # XP rates, level thresholds, unlock table
│   ├── controllers/
│   │   ├── chatController.js   # Message send/fetch logic
│   │   └── userController.js   # User registration, lookup, session XP
│   ├── models/
│   │   ├── MessageSqlite.js    # Message rows + reactions
│   │   └── UserSqlite.js       # User rows (XP, stats, Patreon)
│   ├── routes/
│   │   ├── audio.js            # BambiCloud playlist fetch + stream proxy
│   │   ├── chat.js             # Chat REST endpoints
│   │   ├── patreon.js          # Patreon OAuth, webhook, status, unlink
│   │   ├── reactions.js        # Emoji reaction endpoints
│   │   ├── upload.js           # Image / video attachment upload
│   │   └── user.js             # User registration / session endpoints
│   ├── sockets/
│   │   └── chatSocket.js       # Socket.IO handlers (chat, mention, bp:control)
│   └── utils/
│       ├── logger.js           # Console logger
│       └── xpService.js        # XP calculation, level-up, prestige logic
├── public/
│   ├── index.html              # Chat single-page app shell
│   ├── profile.html            # Public profile page
│   ├── help.html               # Features guide
│   ├── disclaimer.html / terms.html / privacy.html
│   ├── chat.js                 # Chat UI + Socket.IO client
│   ├── audio-player.js         # BambiCloud audio player UI
│   ├── buttplug-panel.js       # Buttplug.io toy control + remote dispatch
│   ├── patreon.js              # Patreon status panel + OAuth popup
│   ├── css/                    # Modular stylesheets (tokens, base, navbar, layout,
│   │                           #   avatar, chat, panels, modals, audio-player,
│   │                           #   buttplug, responsive, …)
│   └── uploads/                # User-uploaded images / videos
├── data/
│   └── app.db                  # SQLite database (auto-created)
├── .env.example                # Environment variable template
├── package.json
└── bambisleepchurch.service    # systemd service unit
```

## Installation

### Prerequisites

- Node.js 18+
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
   | `PORT` | HTTP port (default `7070`) |
   | `SECRET_KEY` | Secret used for session signing |
   | `NODE_ENV` | `development` or `production` |
   | `PATREON_CLIENT_ID` | From the Patreon developer portal |
   | `PATREON_CLIENT_SECRET` | From the Patreon developer portal |
   | `PATREON_REDIRECT_URI` | Must match exactly — e.g. `https://bambisleep.church/auth/patreon/callback` |
   | `PATREON_CAMPAIGN_ID` | Your creator campaign ID |
   | `PATREON_WEBHOOK_SECRET` | Secret returned when creating a Patreon webhook |
   | `APP_BASE_URL` | Public base URL, e.g. `https://bambisleep.church` |

   > The SQLite database file is created automatically at `data/app.db` on first run — no separate database server to install or configure.

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

## Toy Control

Toy control runs entirely in the browser, talking WebSocket to a locally-running [Intiface Central](https://intiface.com/central) instance (`ws://localhost:12345` by default).

- **Local control** — connect from the *Toy Connection* panel on the right; hover **your own** username to open the *Toy Patterns* modal with patterns, master intensity, and per-device sliders.
- **Remote control** — hover **another user's** name (in chat or the Online list) to open the same modal targeting *their* device. Pattern, All Vibrate, and All Stop are forwarded over the chat socket as a sanitised `{action, name, intensity}` payload; the receiver's browser executes them on their own connected hardware. No raw device data ever leaves the receiver.
- **Haptic @mentions** — being `@mentioned` triggers a short pulse on your connected toy.
- **Audio sync** — the audio panel can tie vibration intensity to the playing track's volume.

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

XP is earned by sending messages (+1 per message, +1 per 10 words), staying in session (+1 per 5 min, capped at 3 hours), first activity of the day (+5), receiving reactions (+2 each), and giving reactions (+1 each).

## Contributing

Pull requests and issues are welcome.
