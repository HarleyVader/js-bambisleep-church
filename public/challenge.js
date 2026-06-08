'use strict';

/**
 * challenge.js — Good Girl timer challenge UI.
 *
 * Renders in two contexts (feature-detected by container id):
 *   • #challenge-widget   (index.html)  — compact countdown for the logged-in bambi
 *   • #challenge-section  (profile.html) — full contract: own = request + tasks,
 *                                          other = assign playlists + view progress
 *
 * A challenge counts down to a fixed deadline and stays LOCKED until every
 * assigned BambiCloud playlist has been fully listened (real playback tracked
 * via the `ap:playback` event dispatched by audio-player.js).
 */
(function () {
  const TOKEN_KEY = 'bimbot_token';
  const token = (localStorage.getItem(TOKEN_KEY) || '').trim();

  const widgetEl  = document.getElementById('challenge-widget');   // index.html
  const sectionEl = document.getElementById('challenge-section');  // profile.html
  if (!widgetEl && !sectionEl) return;

  const DURATIONS = [
    { label: '1 hour',  seconds: 3600 },
    { label: '6 hours', seconds: 21600 },
    { label: '24 hours', seconds: 86400 },
  ];

  // ── State ───────────────────────────────────────────────────────────────────
  let ownUsername    = null;   // logged-in bambi
  let ownIsPatron    = false;  // may request / assign
  let targetUsername = null;   // whose challenge the section shows (profile page)
  let isOwn          = true;   // is the rendered challenge the viewer's own?
  let challenge      = null;   // cached challenge object being displayed

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function fmtCountdown(ms) {
    if (ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function fmtMins(seconds) {
    const m = Math.round((seconds || 0) / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  }

  async function api(path, opts) {
    const res = await fetch(path, opts);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status, body });
    return body;
  }

  // ── Data ────────────────────────────────────────────────────────────────────
  async function loadOwnUser() {
    if (!token) return null;
    try {
      const u = await api(`/api/user/${encodeURIComponent(token)}`);
      ownUsername = u.username;
      const cents = u.patreon && u.patreon.currentlyEntitledAmountCents || 0;
      ownIsPatron = u.role === 'creator'
        || (u.patreon && u.patreon.patronStatus === 'active_patron' && cents >= 200);
      return u;
    } catch {
      return null;
    }
  }

  async function fetchChallengeFor(username) {
    return api(`/api/challenge/${encodeURIComponent(username)}?session=${encodeURIComponent(token)}`);
  }

  // ── Rendering ───────────────────────────────────────────────────────────────
  function taskRowHtml(t) {
    const pct = t.totalSeconds ? Math.min(100, Math.round((t.listenedSeconds / t.totalSeconds) * 100)) : 0;
    return `
      <li class="ch-task ${t.complete ? 'ch-task--done' : ''}">
        <div class="ch-task-head">
          <span class="ch-task-icon">${t.complete ? '\uD83D\uDC96' : '\uD83D\uDD12'}</span>
          <a class="ch-task-title" href="${esc(t.playlistUrl)}" target="_blank" rel="noopener">${esc(t.title)}</a>
          <span class="ch-task-pct">${pct}%</span>
        </div>
        <div class="ch-task-bar"><div class="ch-task-fill" style="width:${pct}%"></div></div>
        <div class="ch-task-meta">${fmtMins(t.listenedSeconds)} / ${fmtMins(t.totalSeconds)} · from ${esc(t.assignedBy)}</div>
      </li>`;
  }

  function timerClass(status) {
    if (status === 'completed') return 'ch-timer--unlocked';
    if (status === 'failed')    return 'ch-timer--failed';
    return 'ch-timer--locked';
  }

  function timerFace(ch) {
    if (!ch || ch.status === 'none') return '<span class="ch-timer-val">--:--:--</span>';
    if (ch.status === 'completed') {
      return '<span class="ch-timer-lock">\uD83D\uDD13</span><span class="ch-timer-val ch-timer-msg">Unlocked! \uD83D\uDC96</span>';
    }
    if (ch.status === 'failed') {
      return '<span class="ch-timer-lock">\uD83D\uDC94</span><span class="ch-timer-val ch-timer-msg">Time\u2019s up</span>';
    }
    const remaining = ch.deadlineAt - Date.now();
    return `<span class="ch-timer-lock">\uD83D\uDD12</span><span class="ch-timer-val" data-deadline="${ch.deadlineAt}">${fmtCountdown(remaining)}</span>`;
  }

  function requestControlsHtml() {
    const btns = DURATIONS.map(
      (d) => `<button type="button" class="ch-req-btn" data-seconds="${d.seconds}">${d.label}</button>`,
    ).join('');
    return `
      <div class="ch-request">
        <p class="ch-request-msg">Request a timer challenge, good girl. Pick how long your contract runs:</p>
        <div class="ch-req-row">${btns}</div>
      </div>`;
  }

  // Compact widget on index.html (always the logged-in bambi's own challenge)
  function renderWidget() {
    if (!token) {
      widgetEl.innerHTML = '<div class="ch-empty">Open chat to start your session, then request a challenge.</div>';
      return;
    }
    const ch = challenge;
    let inner = '';
    const active = ch && ch.status === 'active';
    const done = ch.tasks ? ch.tasks.filter((t) => t.complete).length : 0;
    const total = ch.tasks ? ch.tasks.length : 0;

    inner += `<div class="ch-timer ${timerClass(ch ? ch.status : 'none')}">${timerFace(ch)}</div>`;

    if (active) {
      inner += `<div class="ch-widget-tasks">${done}/${total} playlists complete</div>`;
      inner += '<a class="ch-widget-link" href="/profile.html?user=' + encodeURIComponent(ownUsername || '') + '">View contract \u2192</a>';
    } else if (!ch || ch.status === 'none' || ch.status === 'completed' || ch.status === 'failed') {
      if (ownIsPatron) {
        if (ch && ch.status === 'completed') inner += '<div class="ch-widget-tasks">Challenge complete \uD83D\uDC96</div>';
        if (ch && ch.status === 'failed')    inner += '<div class="ch-widget-tasks">Challenge failed \uD83D\uDC94</div>';
        inner += requestControlsHtml();
      } else {
        inner += '<div class="ch-empty">Become a Good Girl patron to request a timer challenge.</div>';
      }
    }
    widgetEl.innerHTML = inner;
    wireRequestButtons(widgetEl);
  }

  // Full contract section on profile.html
  function renderSection() {
    const ch = challenge;
    let inner = '<h2 class="ch-section-title">\uD83D\uDC95 Good Girl Timer Challenge</h2>';

    if (!token) {
      inner += '<div class="ch-empty">Open the chat first to create your session.</div>';
      sectionEl.innerHTML = inner;
      return;
    }

    inner += `<div class="ch-timer ${timerClass(ch ? ch.status : 'none')}">${timerFace(ch)}</div>`;

    if (ch && ch.status === 'active') {
      inner += '<p class="ch-lock-note">\uD83D\uDD12 Locked until every playlist is fully listened.</p>';
    }

    // Task list
    if (ch && ch.tasks && ch.tasks.length) {
      inner += `<ul class="ch-task-list">${ch.tasks.map(taskRowHtml).join('')}</ul>`;
    } else if (ch && ch.status === 'active') {
      inner += '<div class="ch-empty">No playlists assigned yet. Other bambis can add tasks below.</div>';
    }

    // Controls
    if (isOwn) {
      if (ownIsPatron && (!ch || ch.status === 'none' || ch.status === 'completed' || ch.status === 'failed')) {
        inner += requestControlsHtml();
      } else if (!ownIsPatron) {
        inner += '<div class="ch-empty">Become a Good Girl patron to request a timer challenge.</div>';
      }
    } else {
      // Viewing another bambi: allow assigning a playlist if they have an active challenge
      if (ownIsPatron && ch && ch.status === 'active') {
        inner += `
          <div class="ch-assign">
            <label class="ch-assign-label" for="ch-assign-url">Assign a BambiCloud playlist to ${esc(targetUsername)}:</label>
            <div class="ch-assign-row">
              <input type="url" id="ch-assign-url" class="ch-assign-input"
                     placeholder="https://bambicloud.com/playlist/…" />
              <button type="button" id="ch-assign-btn" class="ch-assign-btn">Assign</button>
            </div>
            <div class="ch-assign-msg" id="ch-assign-msg"></div>
          </div>`;
      } else if (ch && ch.status !== 'active') {
        inner += '<div class="ch-empty">This bambi has no active challenge right now.</div>';
      }
    }

    sectionEl.innerHTML = inner;
    wireRequestButtons(sectionEl);
    wireAssign(sectionEl);
  }

  function render() {
    if (widgetEl) renderWidget();
    if (sectionEl) renderSection();
  }

  // ── Event wiring ────────────────────────────────────────────────────────────
  function wireRequestButtons(root) {
    root.querySelectorAll('.ch-req-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const seconds = parseInt(btn.dataset.seconds, 10);
        root.querySelectorAll('.ch-req-btn').forEach((b) => { b.disabled = true; });
        try {
          challenge = await api('/api/challenge/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: token, durationSeconds: seconds }),
          });
          render();
        } catch (err) {
          alert(err.message || 'Could not start challenge.');
          root.querySelectorAll('.ch-req-btn').forEach((b) => { b.disabled = false; });
        }
      });
    });
  }

  function wireAssign(root) {
    const btn = root.querySelector('#ch-assign-btn');
    const input = root.querySelector('#ch-assign-url');
    const msg = root.querySelector('#ch-assign-msg');
    if (!btn || !input) return;
    btn.addEventListener('click', async () => {
      const url = input.value.trim();
      if (!url) return;
      btn.disabled = true;
      if (msg) { msg.textContent = 'Assigning…'; msg.className = 'ch-assign-msg'; }
      try {
        const out = await api(`/api/challenge/${encodeURIComponent(targetUsername)}/task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: token, url }),
        });
        challenge = out.challenge;
        input.value = '';
        render();
      } catch (err) {
        if (msg) { msg.textContent = err.message || 'Could not assign playlist.'; msg.className = 'ch-assign-msg ch-assign-msg--err'; }
        btn.disabled = false;
      }
    });
  }

  // ── Live countdown ──────────────────────────────────────────────────────────
  setInterval(() => {
    document.querySelectorAll('.ch-timer-val[data-deadline]').forEach((el) => {
      const remaining = Number(el.dataset.deadline) - Date.now();
      el.textContent = fmtCountdown(remaining);
      if (remaining <= 0) refresh(); // re-fetch to flip status to failed/completed
    });
  }, 1000);

  // ── Playback progress reporting (index.html only) ───────────────────────────
  const pending = {};       // playlistId -> accumulated seconds awaiting flush
  let lastFlush = 0;

  function ownActiveTask(playlistId) {
    if (!challenge || challenge.status !== 'active' || !isOwn) return null;
    return (challenge.tasks || []).find((t) => t.playlistId === playlistId && !t.complete) || null;
  }

  async function flushProgress() {
    lastFlush = Date.now();
    for (const playlistId of Object.keys(pending)) {
      const delta = pending[playlistId];
      delete pending[playlistId];
      if (!delta || delta <= 0) continue;
      try {
        const out = await api('/api/challenge/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: token, playlistId, deltaSeconds: delta }),
        });
        if (out.challenge) { challenge = out.challenge; render(); }
      } catch (_) { /* keep playing; retry on next flush */ }
    }
  }

  document.addEventListener('ap:playback', (e) => {
    const { playlistId, deltaSeconds } = e.detail || {};
    if (!playlistId || !token) return;
    if (!ownActiveTask(playlistId)) return;
    pending[playlistId] = (pending[playlistId] || 0) + deltaSeconds;
    if (Date.now() - lastFlush >= 10000) flushProgress();
  });

  setInterval(() => { if (Object.keys(pending).length) flushProgress(); }, 10000);
  window.addEventListener('pagehide', () => {
    // Best-effort final flush
    if (Object.keys(pending).length) flushProgress();
  });

  // ── Live updates via chat socket (index.html) ───────────────────────────────
  function subscribeSocket() {
    const sock = window._chatSocket;
    if (!sock) return;
    sock.on('challenge:update', (ch) => {
      // Only our own widget tracks the logged-in bambi; profile updates handled by refresh
      if (isOwn) { challenge = ch; render(); }
    });
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  async function refresh() {
    try {
      challenge = await fetchChallengeFor(targetUsername);
    } catch {
      challenge = { status: 'none', tasks: [] };
    }
    render();
  }

  async function init() {
    await loadOwnUser();

    if (sectionEl) {
      const params = new URLSearchParams(location.search);
      targetUsername = params.get('user') || ownUsername;
      isOwn = !!ownUsername && targetUsername === ownUsername;
    } else {
      targetUsername = ownUsername;
      isOwn = true;
    }

    if (!token || !targetUsername) { render(); return; }

    await refresh();
    subscribeSocket();
    // Profile page has no chat socket — poll for assignments/expiry.
    if (!window._chatSocket) setInterval(refresh, 20000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API for in-chat assignment (index.html) ──────────────────────────
  window.bambiChallenge = {
    /** True if the logged-in bambi may assign playlist tasks. */
    canAssign() { return !!token && ownIsPatron; },
    /** The logged-in bambi's username (or null). */
    ownUsername() { return ownUsername; },
    /**
     * Assign a BambiCloud playlist to a target bambi's active challenge.
     * Resolves with the updated challenge; rejects with an Error (message + .status).
     */
    async assign(targetName, url) {
      if (!token) throw new Error('Open chat to create your session first.');
      const out = await api(`/api/challenge/${encodeURIComponent(targetName)}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: token, url }),
      });
      // If we're assigning to ourselves, reflect it immediately.
      if (isOwn && targetName === targetUsername) { challenge = out.challenge; render(); }
      return out.challenge;
    },
  };
}());
