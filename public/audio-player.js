'use strict';

/**
 * audio-player.js
 *
 * Renders a playlist fetched dynamically via /api/audio/fetch-playlist,
 * plays files through the server proxy (/api/audio/stream?url=…), and
 * analyses audio amplitude in real-time to drive connected buttplug devices.
 *
 * Playlist loading is triggered externally – call:
 *   window._audioPlayer.loadPlaylist('https://bambicloud.com/playlist/<uuid>')
 * This is called automatically from chat.js whenever a user posts a
 * BambiCloud playlist URL.
 *
 * Depends on:
 *   window._bpPanel  – ButtplugPanel instance (set in buttplug-panel.js)
 *   Web Audio API    – supported in all modern browsers
 */

class AudioPlayer {
  constructor() {
    // ── DOM refs ──────────────────────────────────────────────────────────────
    this._panel       = document.getElementById('ap-panel');
    this._trackList   = document.getElementById('ap-track-list');
    this._title       = document.getElementById('ap-now-title');
    this._author      = document.getElementById('ap-now-author');
    this._playBtn     = document.getElementById('ap-play-btn');
    this._prevBtn     = document.getElementById('ap-prev-btn');
    this._nextBtn     = document.getElementById('ap-next-btn');
    this._progress    = document.getElementById('ap-progress');
    this._elapsed     = document.getElementById('ap-elapsed');
    this._remaining   = document.getElementById('ap-remaining');
    this._volSlider   = document.getElementById('ap-volume');
    this._bpToggle    = document.getElementById('ap-bp-toggle');
    this._bpStatus    = document.getElementById('ap-bp-status');
    this._vizCanvas   = document.getElementById('ap-visualizer');
    this._panelToggle = document.getElementById('ap-panel-toggle');
    this._panelBody   = document.getElementById('ap-panel-body');

    if (!this._panel) return;

    // ── State ─────────────────────────────────────────────────────────────────
    this._playlist   = [];
    this._currentIdx = -1;
    this._bpEnabled  = false;
    this._animFrame  = null;
    this._loadingUrl = null;   // guard: ignore duplicate concurrent loads

    // ── Audio pipeline ────────────────────────────────────────────────────────
    this._audio             = new Audio();
    this._audio.crossOrigin = 'anonymous';
    this._audio.preload     = 'metadata';

    this._audioCtx   = null;
    this._analyser   = null;
    this._sourceNode = null;
    this._gainNode   = null;
    this._dataArr    = null;

    // ── Volume ────────────────────────────────────────────────────────────────
    this._volume = parseFloat(localStorage.getItem('ap_volume') ?? '0.8');
    this._audio.volume = this._volume;
    if (this._volSlider) this._volSlider.value = Math.round(this._volume * 100);

    // ── Events ────────────────────────────────────────────────────────────────
    this._audio.addEventListener('timeupdate', () => this._onTimeUpdate());
    this._audio.addEventListener('ended',      () => this._playNext());
    this._audio.addEventListener('error',      () => this._onError());
    this._audio.addEventListener('canplay',    () => { if (this._playBtn) this._playBtn.disabled = false; });

    this._playBtn?.addEventListener('click',     () => this._togglePlay());
    this._prevBtn?.addEventListener('click',     () => this._playPrev());
    this._nextBtn?.addEventListener('click',     () => this._playNext());
    this._panelToggle?.addEventListener('click', () => this._togglePanel());

    this._progress?.addEventListener('input', () => {
      if (this._audio.duration) {
        this._audio.currentTime = (this._progress.value / 1000) * this._audio.duration;
      }
    });

    this._volSlider?.addEventListener('input', () => {
      this._volume = this._volSlider.value / 100;
      this._audio.volume = this._volume;
      if (this._gainNode) this._gainNode.gain.value = this._volume;
      localStorage.setItem('ap_volume', String(this._volume));
    });

    this._bpToggle?.addEventListener('click', () => this._toggleBpSync());

    // Idle state on boot
    this._setIdleState();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Load a BambiCloud playlist by its full URL.
   * Called automatically from chat.js when a BambiCloud playlist URL is posted.
   * Duplicate calls for the same URL within the same session are no-ops.
   */
  async loadPlaylist(bambicloudUrl) {
    if (this._loadingUrl === bambicloudUrl) return;
    this._loadingUrl = bambicloudUrl;

    if (this._trackList) this._trackList.innerHTML = '<div class="ap-loading">Fetching from BambiCloud…</div>';
    if (this._title)  this._title.textContent  = 'Loading…';
    if (this._author) this._author.textContent = '';

    try {
      const res = await fetch(`/api/audio/fetch-playlist?url=${encodeURIComponent(bambicloudUrl)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();

      this._playlist   = data.tracks || [];
      this._currentIdx = -1;

      if (this._title)  this._title.textContent  = data.title;
      if (this._author) this._author.textContent = `by ${data.author} · ${this._playlist.length} tracks`;

      this._renderTrackList(data);
      if (this._bpStatus) this._bpStatus.textContent = `Loaded: ${data.title}`;
    } catch (err) {
      this._loadingUrl = null;   // allow retry on failure
      if (this._trackList) {
        this._trackList.innerHTML = `<div class="ap-error">Could not load playlist: ${this._esc(err.message)}</div>`;
      }
      if (this._title) this._title.textContent = 'Load failed';
    }
  }

  // ── Playlist rendering ────────────────────────────────────────────────────

  _setIdleState() {
    if (this._trackList) {
      this._trackList.innerHTML =
        '<div class="ap-idle">Post a <strong>bambicloud.com/playlist/…</strong> URL in chat to load a playlist.</div>';
    }
    if (this._title)  this._title.textContent  = 'No playlist loaded';
    if (this._author) this._author.textContent = '';
  }

  _renderTrackList(data) {
    if (!this._trackList) return;
    this._trackList.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'ap-playlist-header';
    header.textContent = `${data.title} · ${data.author}`;
    this._trackList.appendChild(header);

    if (!this._playlist.length) {
      this._trackList.innerHTML += '<div class="ap-error">No playable tracks found.</div>';
      return;
    }

    this._playlist.forEach((track, idx) => {
      const item = document.createElement('button');
      item.className  = 'ap-track-item';
      item.type       = 'button';
      item.dataset.idx = idx;

      const noUrl = !track.url;
      if (noUrl) item.disabled = true;

      item.innerHTML = `
        <span class="ap-track-num">${track.index}</span>
        <span class="ap-track-info">
          <span class="ap-track-title">${this._esc(track.title)}</span>
          <span class="ap-track-meta">${this._esc(track.author)} · ${this._esc(track.duration)}</span>
        </span>
        <span class="ap-track-dur">${noUrl ? '🔒' : this._esc(track.duration)}</span>
      `;
      if (!noUrl) item.addEventListener('click', () => this._selectTrack(idx));
      this._trackList.appendChild(item);
    });
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  _selectTrack(idx) {
    if (idx < 0 || idx >= this._playlist.length) return;
    const track = this._playlist[idx];
    if (!track.url) return;

    this._currentIdx = idx;
    const proxyUrl = `/api/audio/stream?url=${encodeURIComponent(track.url)}`;

    this._audio.pause();
    this._audio.src = proxyUrl;
    if (this._playBtn) this._playBtn.disabled = true;
    this._audio.load();

    if (this._title)  this._title.textContent  = track.title;
    if (this._author) this._author.textContent = `${track.author} · ${track.duration}`;

    this._trackList?.querySelectorAll('.ap-track-item').forEach((el, i) => {
      el.classList.toggle('ap-track-active', i === idx);
    });

    this._ensureAudioContext();
    this._audio.play().catch(() => {});
    this._updatePlayBtn(true);
  }

  _togglePlay() {
    if (this._currentIdx === -1) {
      const first = this._playlist.findIndex((t) => t.url);
      if (first === -1) return;
      this._selectTrack(first);
      return;
    }
    if (this._audio.paused) {
      this._ensureAudioContext();
      this._audio.play().catch(() => {});
      this._updatePlayBtn(true);
    } else {
      this._audio.pause();
      this._updatePlayBtn(false);
    }
  }

  _playNext() {
    if (!this._playlist.length) return;
    let next = (this._currentIdx + 1) % this._playlist.length;
    let tries = 0;
    while (!this._playlist[next].url && tries++ < this._playlist.length) {
      next = (next + 1) % this._playlist.length;
    }
    this._selectTrack(next);
  }

  _playPrev() {
    if (this._audio.currentTime > 3) { this._audio.currentTime = 0; return; }
    if (!this._playlist.length) return;
    let prev = (this._currentIdx - 1 + this._playlist.length) % this._playlist.length;
    let tries = 0;
    while (!this._playlist[prev].url && tries++ < this._playlist.length) {
      prev = (prev - 1 + this._playlist.length) % this._playlist.length;
    }
    this._selectTrack(prev);
  }

  _updatePlayBtn(playing) {
    if (!this._playBtn) return;
    this._playBtn.textContent = playing ? '⏸' : '▶';
    this._playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  _onTimeUpdate() {
    const cur = this._audio.currentTime;
    const dur = this._audio.duration || 0;
    if (this._progress && dur) this._progress.value = (cur / dur) * 1000;
    if (this._elapsed)   this._elapsed.textContent  = this._fmtTime(cur);
    if (this._remaining) this._remaining.textContent = dur ? `-${this._fmtTime(dur - cur)}` : '--:--';
  }

  _onError() {
    if (this._title) this._title.textContent = 'Playback error';
    this._updatePlayBtn(false);
  }

  // ── Web Audio context + analyser ─────────────────────────────────────────

  _ensureAudioContext() {
    if (this._audioCtx) {
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
      return;
    }

    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this._analyser = this._audioCtx.createAnalyser();
    this._analyser.fftSize = 256;
    this._dataArr  = new Uint8Array(this._analyser.frequencyBinCount);

    this._gainNode = this._audioCtx.createGain();
    this._gainNode.gain.value = this._volume;

    this._sourceNode = this._audioCtx.createMediaElementSource(this._audio);
    this._sourceNode.connect(this._gainNode);
    this._gainNode.connect(this._analyser);
    this._analyser.connect(this._audioCtx.destination);

    this._startAnalysisLoop();
  }

  // ── Analysis + vibration loop ────────────────────────────────────────────

  _startAnalysisLoop() {
    const canvas = this._vizCanvas;
    const ctx2d  = canvas ? canvas.getContext('2d') : null;

    const tick = () => {
      this._animFrame = requestAnimationFrame(tick);
      if (!this._analyser) return;

      this._analyser.getByteFrequencyData(this._dataArr);

      const sumSq = this._dataArr.reduce((s, v) => s + v * v, 0);
      const rms   = Math.sqrt(sumSq / this._dataArr.length) / 255;

      if (ctx2d && canvas) this._drawVisualizer(ctx2d, canvas);
      if (this._bpEnabled)  this._driveVibration(rms);
    };

    tick();
  }

  _drawVisualizer(ctx, canvas) {
    const W    = canvas.width;
    const H    = canvas.height;
    const bins = this._dataArr.length;
    const barW = W / bins;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15, 5, 20, 0.85)';
    ctx.fillRect(0, 0, W, H);

    this._dataArr.forEach((val, i) => {
      const barH = (val / 255) * H;
      const hue  = 300 + (i / bins) * 60;
      ctx.fillStyle = `hsl(${hue},90%,60%)`;
      ctx.fillRect(i * barW, H - barH, barW - 1, barH);
    });
  }

  _driveVibration(rms) {
    const bp = window._bpPanel;
    if (!bp?._client?.connected) return;
    const intensity = Math.min(1, Math.pow(rms * 2.5, 0.7));
    bp._devices.forEach((device) => {
      if (device.vibrateAttributes.length > 0) {
        device.vibrate(intensity).catch(() => {});
      }
    });
  }

  // ── Buttplug sync toggle ─────────────────────────────────────────────────

  _toggleBpSync() {
    this._bpEnabled = !this._bpEnabled;
    if (this._bpToggle) {
      this._bpToggle.classList.toggle('ap-bp-active', this._bpEnabled);
      this._bpToggle.textContent = this._bpEnabled ? '🔌 Sync: ON' : '🔌 Sync: OFF';
    }
    if (this._bpStatus) {
      this._bpStatus.textContent = this._bpEnabled ? 'Vibration synced to audio' : 'Vibration sync disabled';
    }
    if (!this._bpEnabled) {
      const bp = window._bpPanel;
      if (bp) bp._devices.forEach((d) => { try { d.stop(); } catch (_) {} });
    }
  }

  // ── Panel collapse ────────────────────────────────────────────────────────

  _togglePanel() {
    const collapsed = this._panelBody.classList.toggle('ap-collapsed');
    this._panelToggle.textContent = collapsed ? '▲' : '▼';
    this._panelToggle.setAttribute('aria-expanded', String(!collapsed));
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  _fmtTime(secs) {
    if (!isFinite(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window._audioPlayer = new AudioPlayer();
});
