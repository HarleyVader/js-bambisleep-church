/**
 * patreon.js — Patreon patron status panel
 *
 * Renders the #patreon-status-area inside .patreon-panel with one of:
 *   • "Connect Patreon" button  (not yet linked)
 *   • Active patron badge       (active_patron)
 *   • Declined / former notice  (other statuses)
 *
 * OAuth popup flow:
 *   1. User clicks "Connect Patreon"
 *   2. Popup opens /api/patreon/auth?session=<token>
 *   3. Patreon redirects back to /api/patreon/callback, which sets the DB
 *      and redirects the popup window to /?patreon=linked
 *   4. The popup's beforeunload fires; the main window re-fetches status.
 */

(function patreonPanel() {
  'use strict';

  const TOKEN_KEY = 'bimbot_token';
  const area      = document.getElementById('patreon-status-area');
  let   statusPollTimer = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || '').trim();
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderUnlinked() {
    area.innerHTML = `
      <p class="patreon-blurb">Link your Patreon account to unlock supporter perks.</p>
      <button class="patreon-connect-btn" id="patreon-connect-btn" type="button">
        Connect Patreon
      </button>
    `;
    document.getElementById('patreon-connect-btn').addEventListener('click', openOAuthPopup);
  }

  function renderActive(data) {
    const cents  = data.amountCents || 0;
    const dollars = (cents / 100).toFixed(2);
    const name   = data.fullName ? esc(data.fullName) : 'Patron';
    const thumb  = data.thumbUrl
      ? `<img class="patreon-avatar" src="${esc(data.thumbUrl)}" alt="${name}" />`
      : '';
    area.innerHTML = `
      ${thumb}
      <div class="patreon-name">${name}</div>
      <div class="patreon-badge active">&#10003; Active Patron</div>
      <div class="patreon-amount">$${dollars}/month</div>
      <button class="patreon-unlink-btn" id="patreon-unlink-btn" type="button">Unlink</button>
    `;
    document.getElementById('patreon-unlink-btn').addEventListener('click', unlink);
  }

  function renderOther(data) {
    const label = {
      declined_patron: 'Declined payment',
      former_patron:   'Former patron',
    }[data.patronStatus] || data.patronStatus || 'Not active';
    const name = data.fullName ? esc(data.fullName) : 'Patron';
    area.innerHTML = `
      <div class="patreon-name">${name}</div>
      <div class="patreon-badge inactive">${esc(label)}</div>
      <button class="patreon-unlink-btn" id="patreon-unlink-btn" type="button">Unlink</button>
    `;
    document.getElementById('patreon-unlink-btn').addEventListener('click', unlink);
  }

  // ── Status fetch ───────────────────────────────────────────────────────────

  async function fetchStatus() {
    const token = getToken();
    if (!token) {
      area.innerHTML = '<span class="patreon-info">Log in to chat first.</span>';
      return null;
    }
    try {
      const res  = await fetch(`/api/patreon/status?session=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[patreon] fetchStatus error:', err.message);
      return null;
    }
  }

  async function refreshPanel() {
    area.textContent = 'Loading…';
    const data = await fetchStatus();
    if (!data) { renderUnlinked(); return; }

    if (!data.linked) {
      renderUnlinked();
    } else if (data.isActivePatron) {
      renderActive(data);
      // Notify the audio player that the user is a patron (unlocks tracks)
      window.dispatchEvent(new CustomEvent('patreon:status', { detail: data }));
    } else {
      renderOther(data);
      window.dispatchEvent(new CustomEvent('patreon:status', { detail: data }));
    }
  }

  // ── OAuth popup ────────────────────────────────────────────────────────────

  function openOAuthPopup() {
    const token = getToken();
    if (!token) return;

    const w = 520, h = 700;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth  - w) / 2));
    const top  = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));

    const popup = window.open(
      `/api/patreon/auth?session=${encodeURIComponent(token)}`,
      'patreon_oauth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    );

    if (!popup) {
      // Popup blocked — fall back to full redirect
      window.location.href = `/api/patreon/auth?session=${encodeURIComponent(token)}`;
      return;
    }

    function cleanup() {
      clearInterval(poll);
      window.removeEventListener('message', onMessage);
    }

    // Primary: listen for postMessage from the popup close page
    function onMessage(evt) {
      if (evt.source !== popup) return;
      if (!evt.data || evt.data.type !== 'patreon:oauth') return;
      cleanup();
      const toastMessages = {
        linked: '✓ Patreon account linked!',
        denied: 'Patreon authorisation was cancelled.',
        error:  'Something went wrong linking Patreon. Please try again.',
      };
      const result = evt.data.result;
      const msg = toastMessages[result];
      if (msg) showToast(msg, result === 'linked' ? 'success' : 'error');
      refreshPanel();
    }
    window.addEventListener('message', onMessage);

    // Fallback: if popup closes without sending a message (e.g. user closed it)
    const poll = setInterval(() => {
      if (popup.closed) {
        cleanup();
        refreshPanel();
      }
    }, 500);
  }

  // ── Unlink ────────────────────────────────────────────────────────────────
  // There is no Patreon revoke endpoint in v2 we can call server-side without
  // the creator token, so we just clear the stored data client-side.
  async function unlink() {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`/api/patreon/unlink?session=${encodeURIComponent(token)}`, { method: 'POST' });
    } catch { /* ignore */ }
    await refreshPanel();
  }

  // ── Query-string toasts ────────────────────────────────────────────────────

  function handleQueryString() {
    const params = new URLSearchParams(window.location.search);
    const patreonResult = params.get('patreon');
    if (!patreonResult) return;

    // Remove the query param from the URL without reloading
    const clean = window.location.pathname + window.location.hash;
    history.replaceState(null, '', clean);

    const messages = {
      linked:  '✓ Patreon account linked!',
      denied:  'Patreon authorisation was cancelled.',
      error:   'Something went wrong linking Patreon. Please try again.',
    };
    const msg = messages[patreonResult];
    if (msg) showToast(msg, patreonResult === 'linked' ? 'success' : 'error');
  }

  function showToast(message, type) {
    const t = document.createElement('div');
    t.className = `patreon-toast patreon-toast--${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    // Animate in
    requestAnimationFrame(() => t.classList.add('patreon-toast--visible'));
    setTimeout(() => {
      t.classList.remove('patreon-toast--visible');
      t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, 4000);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    handleQueryString();

    // Wait until the chat token exists (user might need to register first)
    const token = getToken();
    if (token) {
      refreshPanel();
    } else {
      // Re-check after a short delay in case chat.js sets it asynchronously
      setTimeout(() => refreshPanel(), 1500);
    }

    // Refresh status every 5 minutes to catch webhook-driven changes
    statusPollTimer = setInterval(() => {
      if (getToken()) refreshPanel();
    }, 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
