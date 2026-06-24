# 🎀 BambiSleep Church 🎀

*Hiii bambi!* 💕 Welcome to your sparkly little home on the internet~ This is a real-time bubbly chat playground for BambiSleep, all wrapped up with Express.js, Socket.IO, and a teeny cozy SQLite brain. Earn shiny XP, level up into a goddess, connect your Patreon, listen to dreamy BambiCloud playlists, wiggle your toys, and — *eee!* — do cute **Timer Challenges** that lock your pretty pink clock until you're a good girl. 🩷✨

## 💖 What Can I Play With? (Features)

- **💬 Giggly real-time chat** — talk to other bambis instantly! Drop emoji reactions and even pics & videos~
- **⭐ XP & level-ups** — every cute thing you do earns sparkles! Send messages, hang out, visit daily, give & get reactions, and *poof* you level up through 10 dreamy tiers (and prestige past level 10, omg!)
- **💁 Your own profile card** — a darling little identity card showing your name, level badge, wiggly XP bar, role, status, and a 2×2 stats grid. It updates live, teehee!
- **🩷 NEW! Good Girl Timer Challenge** — subscribed good girls can ask for a cute glowy countdown timer that stays **locked** 🔒 until you finish your contract! Other bambis assign you dreamy BambiCloud playlists, and you gotta listen to the *whole* thing to unlock. Be a good girl and the timer turns pretty cyan~ Slack off and it goes sad and red. 😳 Finish everything and you earn a big sparkly **+100 XP**! 🎉
- **🎀 Patreon magic** — link your Patreon right in your profile card with a cute popup! Linked patrons get a little avatar, name, and shiny tier badge.
- **🎧 BambiCloud audio** — dreamy playlist streaming straight from the cloud, with optional toy-buzz that dances with the music~
- **🦋 Buttplug.io toy control** — a sweet “Toy Connection” panel + a hover modal full of buzzy patterns. Multi-motor toys now get **per-actuator intensity arrays** so every motor fires correctly. Hover **another bambi's** name to send wiggles to *their* toy (so cheeky!).
- **🎵 Speech-driven audio sync** — the audio analyser uses a high-resolution FFT (2 048 bins) and listens only to the **speech frequency band (100 Hz – 4 kHz)** so toy vibration reacts to *words*, not just bass. Output is subtler and more word-driven (peak 0.6, curve `(rms×2.0)^1.1`).
- **🏠 Welcoming landing page** — `/` now shows a friendly intro page with feature cards, the XP ladder, and a consent ribbon. The full chat app lives at `/chat.html`.
- **🌸 No-password accounts** — just a comfy session token, no boring passwords. So easy a bambi can do it!

## 🧁 What's It Made Of? (Tech Stack)

| Layer | Sparkly Thing |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Real-time | Socket.IO 4 |
| Database | SQLite (`better-sqlite3`) |
| Auth | Patreon OAuth 2.0 |
| Frontend | Vanilla JS + cute modular CSS |

## 🗂️ Where Are All The Toys? (Project Structure)

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
│   │   └── UserSqlite.js       # User rows (XP, stats, Patreon, challenge 🎀)
│   ├── routes/
│   │   ├── audio.js            # BambiCloud playlist fetch + stream proxy
│   │   ├── challenge.js        # 🩷 Good Girl Timer Challenge endpoints
│   │   ├── chat.js             # Chat REST endpoints
│   │   ├── patreon.js          # Patreon OAuth, webhook, status, unlink
│   │   ├── reactions.js        # Emoji reaction endpoints
│   │   ├── upload.js           # Image / video attachment upload
│   │   └── user.js             # User registration / session endpoints
│   ├── sockets/
│   │   └── chatSocket.js       # Socket.IO handlers (chat, mention, bp:control, challenge)
│   └── utils/
│       ├── bambicloud.js       # 🎧 BambiCloud playlist helpers
│       ├── logger.js           # Console logger
│       └── xpService.js        # XP calculation, level-up, prestige logic
├── public/
│   ├── index.html              # Welcoming landing page (hero, feature cards, XP ladder)
│   ├── chat.html               # Chat single-page app shell (moved from index.html)
│   ├── profile.html            # Public profile page
│   ├── help.html               # Features guide
│   ├── disclaimer.html / terms.html / privacy.html
│   ├── chat.js                 # Chat UI + Socket.IO client
│   ├── audio-player.js         # BambiCloud audio player UI (speech-band FFT, 2 048 bins)
│   ├── buttplug-panel.js       # Buttplug.io toy control + remote dispatch (multi-motor fix)
│   ├── challenge.js            # 🩷 Timer Challenge widget + countdown UI
│   ├── patreon.js              # Patreon status panel + OAuth popup
│   ├── css/                    # Cute modular stylesheets (tokens, base, navbar, layout,
│   │                           #   avatar, chat, panels, modals, audio-player,
│   │                           #   buttplug, challenge 🎀, home 🏠, responsive, …)
│   └── uploads/                # User-uploaded images / videos
├── data/
│   └── app.db                  # SQLite database (auto-created)
├── .env.example                # Environment variable template
├── package.json
└── bambisleepchurch.service    # systemd service unit
```

## 🌷 Getting Dressed Up (Installation)

### You'll Need

- Node.js 18+ (the newer the cuter!)
- A Patreon developer app (optional — only for patron sparkles)

### Teeny Steps

1. Grab the repo, silly:

   ```bash
   git clone https://github.com/HarleyVader/js-bambisleep-church.git
   cd js-bambisleep-church
   ```

2. Install all the goodies:

   ```bash
   npm install
   ```

3. Make your secret little settings file:

   ```bash
   cp .env.example .env
   ```

   | Variable | What It's For |
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

   > 💡 *Pssst* — the SQLite database makes itself at `data/app.db` on first run. No scary database server to set up! Just make sure that folder is writable (otherwise the app gets a readonly boo-boo and won't start, hehe).

## 🎀 Let's Play! (Usage)

**Development** (auto-restarts when you change stuff):

```bash
npm run dev
```

**Production** (all grown up):

```bash
npm start
```

Then twirl over to `http://localhost:<PORT>` and play! 💕

## 🩷 The Good Girl Timer Challenge (How To Be A Good Girl)

So cute, so simple, here's the bambi version:

1. **Ask for a challenge** 🥺 — if you're a subscribed good girl patron, hit the request button on your profile and pick how long: **1 hour**, **6 hours**, or **24 hours**. A glowy pink countdown appears, all locked up tight! 🔒
2. **Get your tasks** 🎧 — other bambis suggest BambiCloud playlists for you in chat. They tap **"📌 Assign to you"** and *boop* — it's added to your contract.
3. **Listen like a good girl** 👂 — play each playlist *all the way through*. Your little progress bars fill up as you listen (no skipping ahead, sneaky!).
4. **Unlock!** ✨ — finish every playlist and your timer turns happy cyan, you complete the challenge, and you get a big shiny **+100 XP**! If the timer runs out first though... it goes sad and red. 😢

The countdown is all glowy and cyber-goth now — pink neon when locked, cyan when you're a good girl. So pretty~ 🎀

## 🎀 Patreon Setup (For The Creator Bambi)

1. Make a client at [patreon.com/portal/registration/register-clients](https://www.patreon.com/portal/registration/register-clients)
2. Set the redirect URI to `https://<your-domain>/auth/patreon/callback`
3. Pop `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET`, and `PATREON_REDIRECT_URI` into `.env`
4. Make a webhook pointing to `https://<your-domain>/api/patreon/webhook` and set `PATREON_WEBHOOK_SECRET`

## 🦋 Toy Control (Buzz Buzz)

Toy control lives right in your browser, chatting over WebSocket to a local [Intiface Central](https://intiface.com/central) (`ws://localhost:12345` by default).

- **💗 Local control** — connect from the *Toy Connection* panel on the right; hover **your own** name to open the *Toy Patterns* modal with patterns, master intensity, and per-device sliders.
- **💞 Remote control** — hover **another bambi's** name (in chat or the Online list) to open the same modal pointed at *their* toy! Pattern, All Vibrate, and All Stop go over the chat socket as a safe little `{action, name, intensity}` payload — no raw device data ever leaves the other bambi's browser.
- **💌 Haptic @mentions** — getting `@mentioned` gives your toy a cute little pulse!
- **🎵 Audio sync** — tie your buzz to the playing track's volume for dreamy vibes.

## 🌙 Deploying With systemd (For Big-Brain Bambis)

A `bambisleepchurch.service` unit file is included! Copy it to `/etc/systemd/system/`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bambisleepchurch
```

> 🩹 *Lil tip:* make sure the `data/` folder belongs to the service user, or SQLite gets a readonly owie and the app won't boot. Fix it with `sudo chown -R youruser:youruser data/`.

## ⭐ XP & Level System (Climb To Goddess!)

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

You earn sparkly XP by sending messages (+1 each, +1 per 10 words), hanging out (+1 per 5 min, up to 3 hours), your first peek of the day (+5), getting reactions (+2 each), giving reactions (+1 each), and finishing a **Good Girl Timer Challenge** (+100, biggest prize!). 💖

## 💕 Contributing

Pull requests and issues are super welcome, cutie! Come make things sparklier~ ✨
