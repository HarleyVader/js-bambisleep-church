# Copilot Instructions

This repository is **BambiSleep Church** — a real-time community chat application built with Express.js, Socket.IO, and MongoDB. It includes a progressive XP/levelling system, procedural avatars, Patreon OAuth 2.0 integration, a BambiCloud audio proxy, and a Buttplug.io toy control panel.

## Project Structure

```
src/
  app.js                  # Express app, middleware, route mounting
  server.js               # HTTP server entry point, Socket.IO init
  config/
    db.js                 # MongoDB connection (Mongoose)
    xpConfig.js           # XP rates, level thresholds, unlock table, prestige titles
  controllers/
    chatController.js     # Message send/fetch logic
    userController.js     # User registration and session lookup
  models/
    Message.js            # Mongoose message schema
    User.js               # Mongoose user schema (XP, avatar, Patreon sub-document)
  routes/
    audio.js              # BambiCloud playlist fetch + cdn.bambicloud.com stream proxy
    chat.js               # Chat REST endpoints; exposes setIo() for XP socket events
    patreon.js            # Patreon OAuth flow, webhook, status, unlink
    reactions.js          # Emoji reaction endpoints
    user.js               # User registration/session endpoints
  sockets/
    chatSocket.js         # Socket.IO event handlers (chat, XP, avatar updates)
  utils/
    avatarGenerator.js    # Procedural sprite generation keyed on level/variant
    logger.js             # Application logger
    xpService.js          # XP calculation, level-up rewards, prestige logic
public/
  index.html              # Single-page app shell
  style.css               # Global styles — match when adding UI
  chat.js                 # Chat UI + Socket.IO client
  audio-player.js         # BambiCloud audio player UI
  buttplug-panel.js       # Buttplug.io WebSocket toy control panel
  patreon.js              # Patreon status panel + OAuth popup flow
  avatars/                # Static avatar sprite assets
```

## Coding Conventions

- **Modules**: CommonJS (`require` / `module.exports`) throughout — do not introduce ES module syntax.
- **Style**: `'use strict';` at the top of every server-side file. Keep functions small and named clearly.
- **Dependencies**: Minimise new dependencies. Prefer Node.js built-ins (`https`, `crypto`, `url`) over third-party HTTP clients.
- **Security**: Validate and sanitise all inputs at route boundaries. Honour the existing allowlists (e.g. `STREAM_ALLOWED_HOSTS` in `audio.js`). Never trust `req.query` without trimming/checking.
- **Environment**: All secrets and URLs live in `.env` via `dotenv`. Never hard-code credentials. Follow the `.env.example` template when adding new vars.
- **Error handling**: Use `try/catch` in async route handlers and log with the shared logger. Return appropriate HTTP status codes.

## Key Subsystems

### Patreon OAuth
- Routes are mounted at both `/api/patreon` and `/auth/patreon` (legacy callback path).
- The callback serves a self-closing HTML page that calls `postMessage` to the opener and then `window.close()` — do not change it back to a plain redirect.
- The frontend popup listener in `public/patreon.js` handles `patreon:oauth` messages and falls back to polling `popup.closed`.

### XP & Levelling
- All rates, thresholds, and unlock tables are in `src/config/xpConfig.js` — edit that file, not the service.
- `xpService.js` mutates the in-memory user document; callers are responsible for persisting via Mongoose.
- Level-up and prestige notifications are sent to the client over Socket.IO.

### Audio Proxy
- Only `cdn.bambicloud.com` URLs are allowed through the stream proxy — enforce via `STREAM_ALLOWED_HOSTS`.
- Forward `Range` headers so the browser can seek within audio files.

### Frontend
- Vanilla JS only — no build step, no bundler, no framework.
- Match existing panel/modal patterns in `index.html` and `style.css` when adding UI.
- Use `localStorage` key `bimbot_token` for the session token (already used by `chat.js` and `patreon.js`).

## What to Avoid

- Do not add features unrelated to chat, XP, avatars, audio, or patron status.
- Do not introduce a frontend build pipeline or TypeScript.
- Do not use `res.redirect` at the end of the Patreon OAuth callback — use the `sendPopupClose` helper.
- Do not bypass the audio CDN allowlist.
- Do not store secrets or tokens in client-side code.