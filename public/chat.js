'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const messagesList      = document.getElementById('messages');
const form              = document.getElementById('chat-form');
const senderInput       = document.getElementById('sender');
const messageInput      = document.getElementById('message');
const statusText        = document.getElementById('status');

// Profile panel
const profileNameEl     = document.getElementById('profile-name');
const profileTitleEl    = document.getElementById('profile-title');
const profileStatusEl   = document.getElementById('profile-status');
const profileRoleEl     = document.getElementById('profile-role');
const avatarFigureEl    = document.getElementById('avatar-figure');
const avatarDecoLayer   = document.getElementById('avatar-deco-layer');
const levelBadgeEl      = document.getElementById('level-badge');
const xpBarFill         = document.getElementById('xp-bar-fill');
const xpBarLabel        = document.getElementById('xp-bar-label');
const prestigeBadgesEl  = document.getElementById('prestige-badges');

// Modal
const editProfileBtn    = document.getElementById('edit-profile');
const profileModal      = document.getElementById('profile-modal');
const profileModalClose = document.getElementById('profile-modal-close');
const profileCancelBtn  = document.getElementById('profile-cancel');
const profileForm       = document.getElementById('profile-form');
const modalNameInput    = document.getElementById('modal-name');
const modalStatusInput  = document.getElementById('modal-status');
const modalRoleInput    = document.getElementById('modal-role');
const modalAvatarFigureEl = document.getElementById('modal-avatar-figure');
const modalAvatarWrap   = document.getElementById('modal-avatar-wrap');
const rerollBtn         = document.getElementById('reroll-btn');
const palettePicker     = document.getElementById('palette-picker');

// Online panel & toasts
const onlineUsersList   = document.getElementById('online-users-list');
const levelupToast      = document.getElementById('levelup-toast');

// Emoji picker
const emojiPicker       = document.getElementById('emoji-picker');

// ── State ─────────────────────────────────────────────────────────────────────
const TOKEN_KEY  = 'bimbot_token';
let myToken      = localStorage.getItem(TOKEN_KEY) || null;
let myUser       = null;
const sessionStart = Date.now();

const LEVEL_THRESHOLDS = [0, 0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250];
const MAX_LEVEL = 10;

const PALETTES = {
  1: '#cc0174',
  2: '#7c3aed',
  3: '#0369a1',
  4: '#b45309',
  5: '#065f46',
};

// ── Socket ────────────────────────────────────────────────────────────────────
const socket = io({ query: { token: myToken || '' } });

// ── Cookie helpers ────────────────────────────────────────────────────────────
const getCookie = (name) => {
  const c = document.cookie.split('; ').find((i) => i.startsWith(`${name}=`));
  return c ? decodeURIComponent(c.split('=')[1]) : null;
};

const setCookie = (name, value, days = 30) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
};

// ── Avatar helpers ────────────────────────────────────────────────────────────
/** Parse a sprite filename like "b3-t2.svg" → [variant, tier] */
const parseSprite = (sprite) => {
  const m = (sprite || '').match(/^b(\d)-t(\d)\.svg$/);
  return m ? [parseInt(m[1]), parseInt(m[2])] : [0, 1];
};

const applyPalette = (paletteId, figureEl) => {
  if (!figureEl) return;
  figureEl.style.setProperty('--avatar-accent', PALETTES[paletteId] || PALETTES[1]);
};

const spriteTier = (level) => (level >= 10 ? 3 : level >= 7 ? 2 : 1);

const applyFigure = (figureEl, baseVariant, tier, paletteId) => {
  if (figureEl) {
    figureEl.dataset.variant = baseVariant;
    figureEl.dataset.tier    = tier;
    applyPalette(paletteId, figureEl);
    return;
  }
  // Main Three.js viewer (no DOM figure in sidebar)
  if (window._avatarViewer) window._avatarViewer.loadModel(baseVariant, tier, paletteId);
};

const applyDecorations = (decorations) => {
  if (!avatarDecoLayer) {
    if (window._avatarViewer) window._avatarViewer.setDecorations(decorations);
    return;
  }
  avatarDecoLayer.innerHTML = '';
  avatarDecoLayer.className = 'avatar-deco-layer';
  (decorations || []).forEach((d) => avatarDecoLayer.classList.add(`deco-${d}`));
  if (avatarFigureEl) {
    avatarFigureEl.classList.remove('deco-crown', 'deco-glow', 'deco-halo');
    (decorations || []).forEach((d) => avatarFigureEl.classList.add(`deco-${d}`));
  }
};

const updateXpBar = (xp, level) => {
  const lo  = LEVEL_THRESHOLDS[Math.min(level, MAX_LEVEL)] || 0;
  const hi  = LEVEL_THRESHOLDS[Math.min(level + 1, MAX_LEVEL + 1)] || lo + 1;
  const pct = level >= MAX_LEVEL
    ? 100
    : Math.min(100, Math.round(((xp - lo) / (hi - lo)) * 100));
  xpBarFill.style.width         = `${pct}%`;
  xpBarLabel.textContent        = `${xp} / ${hi} XP`;
  xpBarFill.parentElement.title = `${xp} / ${hi} XP`;
};

const updateProfileUI = (user) => {
  if (!user) return;
  myUser = user;

  profileNameEl.textContent   = user.username;
  profileTitleEl.textContent  = user.avatar.title || '';
  profileStatusEl.textContent = getCookie('chat_status') || 'Ready to chat';
  profileRoleEl.textContent   = getCookie('chat_role') || 'Visitor';
  senderInput.value           = user.username;

  const tier = spriteTier(user.progress.level);
  applyFigure(avatarFigureEl, user.avatar.baseVariant, tier, user.avatar.colorPaletteId);
  applyFigure(modalAvatarFigureEl, user.avatar.baseVariant, tier, user.avatar.colorPaletteId);
  applyDecorations(user.avatar.decorations);

  levelBadgeEl.textContent = `Lv ${user.progress.level}`;
  updateXpBar(user.progress.xp, user.progress.level);

  prestigeBadgesEl.innerHTML = '';
  (user.avatar.prestigeBadges || []).forEach((b) => {
    const span = document.createElement('span');
    span.className   = 'prestige-badge';
    span.textContent = b;
    prestigeBadgesEl.appendChild(span);
  });

  // Stats
  const s = user.stats || {};
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0);
  const statMessages  = document.getElementById('stat-messages');
  const statWords     = document.getElementById('stat-words');
  const statDays      = document.getElementById('stat-days');
  const statReactions = document.getElementById('stat-reactions');
  if (statMessages)  statMessages.textContent  = fmt(s.messagesCount);
  if (statWords)     statWords.textContent     = fmt(s.wordsCount);
  if (statDays)      statDays.textContent      = String((s.uniqueDaysActive || []).length);
  if (statReactions) statReactions.textContent = fmt(s.reactionsGiven || 0);
};

// ── Palette picker ────────────────────────────────────────────────────────────
const renderPalettePicker = (unlockedPalettes, activePaletteId) => {
  palettePicker.innerHTML = '';
  Object.entries(PALETTES).forEach(([id, colour]) => {
    const btn = document.createElement('button');
    btn.type             = 'button';
    btn.className        = 'palette-swatch' + (parseInt(id) === activePaletteId ? ' active' : '');
    btn.style.background = colour;
    btn.title            = `Palette ${id}`;
    if (!unlockedPalettes.includes(parseInt(id))) {
      btn.disabled = true;
      btn.classList.add('locked');
    }
    btn.addEventListener('click', () => selectPalette(parseInt(id)));
    palettePicker.appendChild(btn);
  });
};

const selectPalette = async (paletteId) => {
  if (!myToken) return;
  try {
    const res = await fetch(`/api/user/${myToken}/palette`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ paletteId }),
    });
    if (!res.ok) return;
    const { avatar } = await res.json();
    myUser.avatar = avatar;
    applyPalette(avatar.colorPaletteId, avatarFigureEl);
    applyPalette(avatar.colorPaletteId, modalAvatarFigureEl);
    if (window._avatarViewer) window._avatarViewer.setPalette(avatar.colorPaletteId);
    renderPalettePicker(avatar.unlockedPalettes, avatar.colorPaletteId);
  } catch (_) { /* no-op */ }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const upsertUser = async (username) => {
  const res = await fetch('/api/user', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, token: myToken }),
  });
  if (!res.ok) throw new Error('auth failed');
  const data = await res.json();
  myToken = data.token;
  localStorage.setItem(TOKEN_KEY, myToken);
  socket.io.opts.query = { token: myToken };
  updateProfileUI(data.user);
  renderPalettePicker(data.user.avatar.unlockedPalettes, data.user.avatar.colorPaletteId);
  return data.user;
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const openProfileModal = (autoOpen = false) => {
  modalNameInput.value   = myUser ? myUser.username : (getCookie('chat_username') || '');
  modalStatusInput.value = getCookie('chat_status') || 'Ready to chat';
  modalRoleInput.value   = getCookie('chat_role') || 'Visitor';
  if (myUser) renderPalettePicker(myUser.avatar.unlockedPalettes, myUser.avatar.colorPaletteId);
  profileModal.classList.add('visible');
  profileModal.setAttribute('aria-hidden', 'false');
  if (autoOpen) modalNameInput.focus();
};

const closeProfileModal = () => {
  profileModal.classList.remove('visible');
  profileModal.setAttribute('aria-hidden', 'true');
};

const saveProfile = async () => {
  const newName   = modalNameInput.value.trim() || 'Anonymous';
  const newStatus = modalStatusInput.value.trim() || 'Ready to chat';
  const newRole   = modalRoleInput.value.trim() || 'Visitor';
  setCookie('chat_username', newName);
  setCookie('chat_status',   newStatus);
  setCookie('chat_role',     newRole);
  try { await upsertUser(newName); } catch (_) { /* no-op */ }
  closeProfileModal();
};

rerollBtn.addEventListener('click', async () => {
  if (!myToken) return;
  try {
    const res = await fetch(`/api/user/${myToken}/reroll`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return;
    const { avatar } = await res.json();
    myUser.avatar = avatar;
    const tier = spriteTier(myUser.progress.level);
    applyFigure(avatarFigureEl, avatar.baseVariant, tier, avatar.colorPaletteId);
    applyFigure(modalAvatarFigureEl, avatar.baseVariant, tier, avatar.colorPaletteId);
  } catch (_) { /* no-op */ }
});

editProfileBtn.addEventListener('click', () => openProfileModal());
profileModalClose.addEventListener('click', closeProfileModal);
profileCancelBtn.addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeProfileModal(); });
profileForm.addEventListener('submit', (e) => { e.preventDefault(); saveProfile(); });

// ── Level-up toast ────────────────────────────────────────────────────────────
let toastTimer = null;
const showToast = (html) => {
  levelupToast.innerHTML = html;
  levelupToast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => levelupToast.classList.remove('visible'), 4000);
};

// ── Socket events ─────────────────────────────────────────────────────────────
socket.on('connect',    () => { statusText.textContent = 'Connected to live chat.'; });
socket.on('disconnect', () => { statusText.textContent = 'Disconnected. Reconnect to continue.'; });
socket.on('chatMessage', () => { loadMessages(); });

socket.on('xpGained', ({ newTotal, level }) => {
  if (!myUser) return;
  myUser.progress.xp    = newTotal;
  myUser.progress.level = level;
  updateXpBar(newTotal, level);
  levelBadgeEl.textContent = `Lv ${level}`;
});

socket.on('profile:update', ({ stats, progress }) => {
  if (!myUser) return;
  if (stats) {
    myUser.stats = { ...myUser.stats, ...stats };
    const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0);
    const statMessages  = document.getElementById('stat-messages');
    const statWords     = document.getElementById('stat-words');
    const statDays      = document.getElementById('stat-days');
    const statReactions = document.getElementById('stat-reactions');
    if (statMessages)  statMessages.textContent  = fmt(stats.messagesCount  ?? myUser.stats.messagesCount);
    if (statWords)     statWords.textContent     = fmt(stats.wordsCount     ?? myUser.stats.wordsCount);
    if (statDays)      statDays.textContent      = String(stats.daysActive  ?? (myUser.stats.uniqueDaysActive || []).length);
    if (statReactions) statReactions.textContent = fmt(stats.reactionsGiven ?? myUser.stats.reactionsGiven ?? 0);
  }
  if (progress) {
    myUser.progress = { ...myUser.progress, ...progress };
    updateXpBar(myUser.progress.xp, myUser.progress.level);
    levelBadgeEl.textContent = `Lv ${myUser.progress.level}`;
  }
});

socket.on('levelUp', ({ newLevel, unlocks, prestiged }) => {
  if (!myUser) return;
  myUser.progress.level    = newLevel;
  levelBadgeEl.textContent = `Lv ${newLevel}`;
  const msg = prestiged
    ? `\u2726 Prestige! Welcome back at level 1`
    : `\u2b06 Level ${newLevel}! ${(unlocks || []).join(' \u00b7 ')}`;
  showToast(msg);
  fetch(`/api/user/${myToken}`)
    .then((r) => r.json())
    .then((u) => {
      updateProfileUI(u);
      renderPalettePicker(u.avatar.unlockedPalettes, u.avatar.colorPaletteId);
    })
    .catch(() => { /* no-op */ });
});

socket.on('onlineUsers', (users) => {
  onlineUsersList.innerHTML = '';
  users.forEach((u) => {
    const [variant, tier] = parseSprite(u.sprite || 'b0-t1.svg');
    const accent  = PALETTES[u.paletteId] || PALETTES[1];
    const initial = (u.username || '?').charAt(0).toUpperCase();
    const el = document.createElement('div');
    el.className = 'online-user';
    el.innerHTML = `
      <div class="online-avatar-badge" data-variant="${variant}" data-tier="${tier}" style="--avatar-accent:${accent}">${initial}</div>
      <span class="online-name">${u.username}</span>
      <span class="online-level">Lv ${u.level}</span>
    `;
    onlineUsersList.appendChild(el);
  });
});

// ── Messages ──────────────────────────────────────────────────────────────────
const formatDate = (v) =>
  new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

let activePickerMsgId = null;

const renderReactions = (container, reactions, msgId) => {
  let bar = container.querySelector('.reaction-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'reaction-bar';
    container.appendChild(bar);
  }
  bar.innerHTML = '';
  (reactions || []).forEach((r) => {
    if (!r.userTokens.length) return;
    const btn = document.createElement('button');
    btn.className   = 'reaction-btn' + (r.userTokens.includes(myToken) ? ' active' : '');
    btn.textContent = `${r.emoji} ${r.userTokens.length}`;
    btn.addEventListener('click', () => reactToMessage(msgId, r.emoji));
    bar.appendChild(btn);
  });
  const addBtn = document.createElement('button');
  addBtn.className   = 'reaction-add-btn';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    activePickerMsgId = msgId;
    const rect = addBtn.getBoundingClientRect();
    emojiPicker.style.top   = `${rect.bottom + window.scrollY + 4}px`;
    emojiPicker.style.left  = '';
    emojiPicker.style.right = `${window.innerWidth - rect.right}px`;
    emojiPicker.hidden = false;
  });
  bar.appendChild(addBtn);
};

const reactToMessage = async (msgId, emoji) => {
  if (!myToken) return;
  try {
    const res = await fetch(`/api/messages/${msgId}/react`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ emoji, token: myToken }),
    });
    if (!res.ok) return;
    const { reactions } = await res.json();
    const el = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (el) renderReactions(el, reactions, msgId);
  } catch (_) { /* no-op */ }
};

document.addEventListener('click', () => {
  emojiPicker.hidden = true;
  activePickerMsgId  = null;
});
emojiPicker.addEventListener('click', (e) => {
  e.stopPropagation();
  const emoji = e.target.dataset.emoji;
  if (!emoji || !activePickerMsgId) return;
  emojiPicker.hidden = true;
  reactToMessage(activePickerMsgId, emoji);
  activePickerMsgId = null;
});

// ── BambiCloud playlist URL detection ────────────────────────────────────────
const BAMBICLOUD_PLAYLIST_RE = /https?:\/\/(?:www\.)?bambicloud\.com\/playlist\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

/**
 * Scan message text for BambiCloud playlist URLs.
 * Returns the first URL found, or null.
 */
const extractPlaylistUrl = (text) => {
  BAMBICLOUD_PLAYLIST_RE.lastIndex = 0;
  const m = BAMBICLOUD_PLAYLIST_RE.exec(text);
  return m ? m[0] : null;
};

/**
 * Replace BambiCloud playlist URLs in text with a linkified span
 * that also shows a small "▶ Load" badge.
 */
const linkifyPlaylistUrls = (text) => {
  return text.replace(
    /https?:\/\/(?:www\.)?bambicloud\.com\/playlist\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    (url) =>
      `<a class="bambi-playlist-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>` +
      `<button class="bambi-load-btn" data-playlist-url="${url}" type="button" aria-label="Load playlist in player">▶ Load playlist</button>`,
  );
};

const appendMessage = (data) => {
  const existing = document.querySelector(`[data-msg-id="${data._id}"]`);
  if (existing) {
    renderReactions(existing, data.reactions, data._id);
    return;
  }
  const snap      = data.avatarSnapshot || {};
  const paletteId = snap.paletteId || 1;
  const accent    = PALETTES[paletteId] || PALETTES[1];
  const [variant, tier] = parseSprite(snap.sprite || 'b0-t1.svg');
  const initial   = (data.sender || '?').charAt(0).toUpperCase();

  // Linkify BambiCloud URLs in the content before rendering
  const renderedContent = linkifyPlaylistUrls(data.content);

  const item = document.createElement('div');
  item.className     = 'message';
  item.dataset.msgId = data._id;
  item.innerHTML = `
    <div class="msg-avatar-badge" data-variant="${variant}" data-tier="${tier}" style="--avatar-accent:${accent}">${initial}</div>
    <div class="msg-body">
      <div class="msg-header">
        <strong>${data.sender}</strong>
        ${snap.title    ? `<span class="msg-title">${snap.title}</span>`                                            : ''}
        ${snap.prestige ? `<span class="msg-prestige">${'\u2726'.repeat(Math.min(snap.prestige, 3))}</span>` : ''}
        <time>${formatDate(data.timestamp)}</time>
      </div>
      <div class="msg-content">${renderedContent}</div>
    </div>
  `;
  renderReactions(item, data.reactions, data._id);
  messagesList.appendChild(item);
  messagesList.scrollTop = messagesList.scrollHeight;

  // Wire any "▶ Load playlist" buttons in this message
  item.querySelectorAll('.bambi-load-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window._audioPlayer) {
        window._audioPlayer.loadPlaylist(btn.dataset.playlistUrl);
      }
    });
  });
};

const loadMessages = async () => {
  try {
    const res = await fetch('/api/chat/messages');
    if (!res.ok) throw new Error('load failed');
    const messages = await res.json();
    messagesList.innerHTML = '';
    messages.forEach((m) => appendMessage(m));
  } catch (_) {
    statusText.textContent = 'Unable to load message history.';
  }
};

// ── Send ──────────────────────────────────────────────────────────────────────
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content) return;
  const sender = senderInput.value.trim() || myUser?.username || getCookie('chat_username') || 'Anonymous';
  try {
    const res = await fetch('/api/chat/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sender, content, token: myToken }),
    });
    if (!res.ok) throw new Error('send failed');
    const { message } = await res.json();
    messageInput.value = '';
    socket.emit('chatMessage', message);
    appendMessage(message);
    messagesList.scrollTop = messagesList.scrollHeight;
  } catch (_) {
    statusText.textContent = 'Failed to send message. Try again.';
  }
});

// ── Session-end beacon ────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (!myToken) return;
  const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000);
  navigator.sendBeacon(
    `/api/user/${myToken}/session-end`,
    new Blob([JSON.stringify({ durationSeconds })], { type: 'application/json' }),
  );
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const init = async () => {
  const savedName = getCookie('chat_username') || '';
  if (savedName) {
    try { await upsertUser(savedName); } catch (_) { /* no-op */ }
  } else {
    openProfileModal(true);
  }
  await loadMessages();
};

init();
