'use strict';

// Buttplug v3 browser integration
// Requires Intiface Central running locally: https://intiface.com/central
// Library loaded from CDN: buttplug@3.x UMD bundle (global: window.Buttplug)

const BP_ADDR_KEY = 'bp_ws_address';
const BP_DEFAULT  = 'ws://localhost:12345';

// Built-in vibration patterns: [intensity_0_to_1, duration_ms][]
const PATTERNS = {
  'Pulse':  [[0.8, 200], [0, 200], [0.8, 200], [0, 200], [0.8, 200], [0, 200]],
  'Wave':   [[0.2, 100], [0.4, 100], [0.6, 100], [0.8, 100], [1.0, 100], [0.8, 100], [0.6, 100], [0.4, 100]],
  'Ramp':   [[0.1, 150], [0.3, 150], [0.5, 150], [0.7, 150], [1.0, 300], [0, 100]],
  'Throb':  [[1.0, 400], [0.3, 200], [1.0, 400], [0, 300]],
};

class ButtplugPanel {
  constructor() {
    this._client      = null;
    this._devices     = new Map(); // deviceIndex → ButtplugClientDevice
    this._patternJobs = new Map(); // deviceIndex → timeout id
    this._scanning    = false;

    // DOM refs
    this._addressInput = document.getElementById('bp-address');
    this._connectBtn   = document.getElementById('bp-connect-btn');
    this._scanBtn      = document.getElementById('bp-scan-btn');
    this._deviceList   = document.getElementById('bp-device-list');
    this._statusEl     = document.getElementById('bp-status');
    this._panelToggle  = document.getElementById('bp-panel-toggle');
    this._panelBody    = document.getElementById('bp-panel-body');

    if (!this._addressInput) return; // guard: panel not in DOM

    // Restore saved address
    const saved = localStorage.getItem(BP_ADDR_KEY);
    if (saved) this._addressInput.value = saved;

    this._connectBtn.addEventListener('click', () => this._toggleConnect());
    this._scanBtn.addEventListener('click',    () => this._toggleScan());
    this._panelToggle.addEventListener('click', () => this._togglePanel());

    // Help modal
    const helpBtn  = document.getElementById('bp-help-btn');
    const modal    = document.getElementById('bp-help-modal');
    const closeBtn = document.getElementById('bp-modal-close');
    if (helpBtn && modal && closeBtn) {
      helpBtn.addEventListener('click', () => { modal.hidden = false; closeBtn.focus(); });
      closeBtn.addEventListener('click', () => { modal.hidden = true; helpBtn.focus(); });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.hidden = true; helpBtn.focus(); }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; helpBtn.focus(); }
      });
    }
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────

  _setStatus(msg) { this._statusEl.textContent = msg; }

  _togglePanel() {
    const collapsed = this._panelBody.classList.toggle('bp-collapsed');
    this._panelToggle.textContent = collapsed ? '▲' : '▼';
    this._panelToggle.setAttribute('aria-expanded', String(!collapsed));
  }

  // ── Connect / disconnect ────────────────────────────────────────────────────

  async _toggleConnect() {
    if (this._client && this._client.connected) {
      await this._disconnect();
    } else {
      await this._connect();
    }
  }

  async _connect() {
    const address = (this._addressInput.value.trim() || BP_DEFAULT);
    localStorage.setItem(BP_ADDR_KEY, address);

    this._setStatus('Connecting…');
    this._connectBtn.disabled = true;

    try {
      this._client = new window.Buttplug.ButtplugClient('BambiSleep Church');

      this._client.addListener('deviceadded',      (d) => this._onDeviceAdded(d));
      this._client.addListener('deviceremoved',    (d) => this._onDeviceRemoved(d));
      this._client.addListener('scanningfinished', () => this._onScanningFinished());
      this._client.addListener('disconnect',       () => this._onServerDisconnect());

      const connector = new window.Buttplug.ButtplugBrowserWebsocketClientConnector(address);
      await this._client.connect(connector);

      this._setStatus('Connected');
      this._connectBtn.textContent = 'Disconnect';
      this._connectBtn.disabled    = false;
      this._connectBtn.classList.add('bp-btn--connected');
      this._scanBtn.disabled       = false;
      this._addressInput.disabled  = true;
    } catch (err) {
      this._setStatus(`Failed: ${err.message || 'Could not connect'}`);
      this._connectBtn.disabled = false;
      this._client = null;
    }
  }

  async _disconnect() {
    if (!this._client) return;
    try { await this._client.disconnect(); } catch (_) { /* ignore */ }
    this._onServerDisconnect();
  }

  _onServerDisconnect() {
    this._patternJobs.forEach(clearTimeout);
    this._patternJobs.clear();
    this._client   = null;
    this._scanning = false;
    this._devices.clear();
    this._deviceList.innerHTML = '';
    this._setStatus('Disconnected');
    this._connectBtn.textContent = 'Connect';
    this._connectBtn.disabled    = false;
    this._connectBtn.classList.remove('bp-btn--connected');
    this._scanBtn.disabled       = true;
    this._scanBtn.textContent    = 'Scan';
    this._addressInput.disabled  = false;
  }

  // ── Scanning ────────────────────────────────────────────────────────────────

  async _toggleScan() {
    if (!this._client) return;
    try {
      if (this._scanning) {
        await this._client.stopScanning();
        this._scanning = false;
        this._scanBtn.textContent = 'Scan';
      } else {
        await this._client.startScanning();
        this._scanning = true;
        this._scanBtn.textContent = 'Stop';
      }
    } catch (_) { /* no-op */ }
  }

  _onScanningFinished() {
    this._scanning = false;
    this._scanBtn.textContent = 'Scan';
  }

  // ── Device management ───────────────────────────────────────────────────────

  _onDeviceAdded(device) {
    this._devices.set(device.index, device);
    this._renderDevice(device);
  }

  _onDeviceRemoved(device) {
    this._devices.delete(device.index);
    this._cancelPattern(device.index);
    const el = document.getElementById(`bp-dev-${device.index}`);
    if (el) el.remove();
    if (!this._devices.size) this._setStatus('Connected – no devices');
  }

  // ── Pattern playback ────────────────────────────────────────────────────────

  _cancelPattern(idx) {
    const job = this._patternJobs.get(idx);
    if (job) clearTimeout(job);
    this._patternJobs.delete(idx);
  }

  _playPattern(device, steps, stepIdx = 0) {
    if (stepIdx >= steps.length || !this._devices.has(device.index)) return;
    const [intensity, duration] = steps[stepIdx];
    try { device.vibrate(intensity); } catch (_) { /* device gone */ }

    // Update slider to reflect pattern intensity
    const slider = document.getElementById(`bp-sl-vib-${device.index}`);
    const valEl  = document.getElementById(`bp-sv-vib-${device.index}`);
    if (slider) slider.value = Math.round(intensity * 100);
    if (valEl)  valEl.textContent = `${Math.round(intensity * 100)}%`;

    const job = setTimeout(() => {
      this._patternJobs.delete(device.index);
      this._playPattern(device, steps, stepIdx + 1);
    }, duration);
    this._patternJobs.set(device.index, job);
  }

  // ── Device card rendering ───────────────────────────────────────────────────

  _renderDevice(device) {
    if (document.getElementById(`bp-dev-${device.index}`)) return;

    const canVibrate   = device.vibrateAttributes   && device.vibrateAttributes.length > 0;
    const canRotate    = device.rotateAttributes    && device.rotateAttributes.length > 0;
    const canOscillate = device.oscillateAttributes && device.oscillateAttributes.length > 0;
    const idx          = device.index;

    const card = document.createElement('div');
    card.className = 'bp-device-card';
    card.id        = `bp-dev-${idx}`;

    // ── vibrate section
    const vibrateHtml = canVibrate ? `
      <div class="bp-section-label">Vibrate</div>
      <div class="bp-control-row">
        <label class="bp-label" for="bp-sl-vib-${idx}">Intensity</label>
        <input class="bp-slider" type="range" min="0" max="100" value="0"
               id="bp-sl-vib-${idx}" aria-label="Vibration intensity" />
        <span class="bp-slider-val" id="bp-sv-vib-${idx}">0%</span>
      </div>
      <div class="bp-pattern-row">
        <span class="bp-label">Pattern</span>
        ${Object.keys(PATTERNS).map((p) =>
          `<button class="bp-pattern-btn" data-pattern="${p}" data-dev="${idx}" type="button">${p}</button>`
        ).join('')}
      </div>
    ` : '';

    // ── rotate section
    const rotateHtml = canRotate ? `
      <div class="bp-section-label">Rotate</div>
      <div class="bp-control-row">
        <label class="bp-label" for="bp-sl-rot-${idx}">Speed</label>
        <input class="bp-slider" type="range" min="0" max="100" value="0"
               id="bp-sl-rot-${idx}" aria-label="Rotation speed" />
        <span class="bp-slider-val" id="bp-sv-rot-${idx}">0%</span>
      </div>
      <div class="bp-control-row">
        <span class="bp-label">Direction</span>
        <button class="bp-dir-btn active" id="bp-dir-${idx}" data-cw="1" type="button">&#8635; CW</button>
      </div>
    ` : '';

    // ── oscillate section
    const oscillateHtml = canOscillate ? `
      <div class="bp-section-label">Oscillate</div>
      <div class="bp-control-row">
        <label class="bp-label" for="bp-sl-osc-${idx}">Intensity</label>
        <input class="bp-slider" type="range" min="0" max="100" value="0"
               id="bp-sl-osc-${idx}" aria-label="Oscillation intensity" />
        <span class="bp-slider-val" id="bp-sv-osc-${idx}">0%</span>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="bp-device-name">${this._esc(device.name)}</div>
      <div class="bp-device-caps">
        ${canVibrate   ? '<span class="bp-cap">Vibrate</span>'   : ''}
        ${canRotate    ? '<span class="bp-cap">Rotate</span>'    : ''}
        ${canOscillate ? '<span class="bp-cap">Oscillate</span>' : ''}
      </div>
      ${vibrateHtml}
      ${rotateHtml}
      ${oscillateHtml}
      <button class="bp-stop-btn" id="bp-stop-${idx}" type="button">&#9632; Stop All</button>
    `;

    this._deviceList.appendChild(card);
    this._setStatus(`Connected – ${this._devices.size} device(s)`);

    // ── vibrate slider
    if (canVibrate) {
      const slider = document.getElementById(`bp-sl-vib-${idx}`);
      const valEl  = document.getElementById(`bp-sv-vib-${idx}`);
      slider.addEventListener('input', async () => {
        this._cancelPattern(idx); // manual override cancels pattern
        const pct = parseInt(slider.value, 10) / 100;
        valEl.textContent = `${Math.round(pct * 100)}%`;
        try { await device.vibrate(pct); } catch (_) { /* gone */ }
      });

      // Pattern buttons
      card.querySelectorAll('.bp-pattern-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this._cancelPattern(idx);
          const steps = PATTERNS[btn.dataset.pattern];
          if (steps) this._playPattern(device, steps);
        });
      });
    }

    // ── rotate slider
    if (canRotate) {
      const slider = document.getElementById(`bp-sl-rot-${idx}`);
      const valEl  = document.getElementById(`bp-sv-rot-${idx}`);
      const dirBtn = document.getElementById(`bp-dir-${idx}`);
      let clockwise = true;

      const sendRotate = async () => {
        const spd = parseInt(slider.value, 10) / 100;
        valEl.textContent = `${Math.round(spd * 100)}%`;
        try { await device.rotate(spd, clockwise); } catch (_) { /* gone */ }
      };

      slider.addEventListener('input', sendRotate);
      dirBtn.addEventListener('click', async () => {
        clockwise = !clockwise;
        dirBtn.dataset.cw    = clockwise ? '1' : '0';
        dirBtn.textContent   = clockwise ? '↻ CW' : '↺ CCW';
        await sendRotate();
      });
    }

    // ── oscillate slider
    if (canOscillate) {
      const slider = document.getElementById(`bp-sl-osc-${idx}`);
      const valEl  = document.getElementById(`bp-sv-osc-${idx}`);
      slider.addEventListener('input', async () => {
        const pct = parseInt(slider.value, 10) / 100;
        valEl.textContent = `${Math.round(pct * 100)}%`;
        try { await device.oscillate(pct); } catch (_) { /* gone */ }
      });
    }

    // ── stop all
    document.getElementById(`bp-stop-${idx}`).addEventListener('click', async () => {
      this._cancelPattern(idx);
      ['vib', 'rot', 'osc'].forEach((t) => {
        const sl = document.getElementById(`bp-sl-${t}-${idx}`);
        const sv = document.getElementById(`bp-sv-${t}-${idx}`);
        if (sl) sl.value = '0';
        if (sv) sv.textContent = '0%';
      });
      try { await device.stop(); } catch (_) { /* ignore */ }
    });
  }

  // ── Public API: fire a pattern on all connected devices (used by audio sync)
  vibrateAll(intensity) {
    this._devices.forEach(async (device) => {
      if (device.vibrateAttributes && device.vibrateAttributes.length) {
        try { await device.vibrate(intensity); } catch (_) { /* gone */ }
      }
    });
  }

  stopAll() {
    this._devices.forEach(async (device) => {
      try { await device.stop(); } catch (_) { /* ignore */ }
    });
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Initialise after DOM and buttplug library are both ready
function initButtplugPanel() {
  if (typeof window.Buttplug === 'undefined') {
    const s = document.getElementById('bp-status');
    if (s) s.textContent = 'Library unavailable';
    return;
  }
  window._bpPanel = new ButtplugPanel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initButtplugPanel);
} else {
  initButtplugPanel();
}

class ButtplugPanel {
  constructor() {
    this._client   = null;
    this._devices  = new Map(); // deviceIndex -> ButtplugClientDevice
    this._scanning = false;

    // DOM refs
    this._addressInput = document.getElementById('bp-address');
    this._connectBtn   = document.getElementById('bp-connect-btn');
    this._scanBtn      = document.getElementById('bp-scan-btn');
    this._deviceList   = document.getElementById('bp-device-list');
    this._statusEl     = document.getElementById('bp-status');
    this._panelToggle  = document.getElementById('bp-panel-toggle');
    this._panelBody    = document.getElementById('bp-panel-body');

    if (!this._addressInput) return; // guard: panel not in DOM

    // Restore saved address
    const saved = localStorage.getItem(BP_ADDR_KEY);
    if (saved) this._addressInput.value = saved;

    this._connectBtn.addEventListener('click', () => this._toggleConnect());
    this._scanBtn.addEventListener('click',    () => this._toggleScan());
    this._panelToggle.addEventListener('click', () => this._togglePanel());

    // Help modal
    const helpBtn   = document.getElementById('bp-help-btn');
    const modal     = document.getElementById('bp-help-modal');
    const closeBtn  = document.getElementById('bp-modal-close');

    if (helpBtn && modal && closeBtn) {
      helpBtn.addEventListener('click', () => {
        modal.hidden = false;
        closeBtn.focus();
      });
      closeBtn.addEventListener('click', () => { modal.hidden = true; helpBtn.focus(); });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.hidden = true; helpBtn.focus(); }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; helpBtn.focus(); }
      });
    }
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────

  _setStatus(msg) {
    this._statusEl.textContent = msg;
  }

  _togglePanel() {
    const collapsed = this._panelBody.classList.toggle('bp-collapsed');
    this._panelToggle.textContent = collapsed ? '▲' : '▼';
    this._panelToggle.setAttribute('aria-expanded', String(!collapsed));
  }

  // ── Connect / disconnect ────────────────────────────────────────────────────

  async _toggleConnect() {
    if (this._client && this._client.connected) {
      await this._disconnect();
    } else {
      await this._connect();
    }
  }

  async _connect() {
    const address = (this._addressInput.value.trim() || BP_DEFAULT);
    localStorage.setItem(BP_ADDR_KEY, address);

    this._setStatus('Connecting…');
    this._connectBtn.disabled = true;

    try {
      this._client = new window.Buttplug.ButtplugClient('BambiSleep Church');

      this._client.addListener('deviceadded',    (d) => this._onDeviceAdded(d));
      this._client.addListener('deviceremoved',  (d) => this._onDeviceRemoved(d));
      this._client.addListener('scanningfinished',   () => this._onScanningFinished());
      this._client.addListener('disconnect',         () => this._onServerDisconnect());

      const connector = new window.Buttplug.ButtplugBrowserWebsocketClientConnector(address);
      await this._client.connect(connector);

      this._setStatus('Connected');
      this._connectBtn.textContent = 'Disconnect';
      this._connectBtn.disabled    = false;
      this._connectBtn.classList.add('bp-btn--connected');
      this._scanBtn.disabled       = false;
      this._addressInput.disabled  = true;
    } catch (err) {
      this._setStatus(`Failed: ${err.message || 'Could not connect'}`);
      this._connectBtn.disabled = false;
      this._client = null;
    }
  }

  async _disconnect() {
    if (!this._client) return;
    try { await this._client.disconnect(); } catch (_) { /* ignore */ }
    this._onServerDisconnect();
  }

  _onServerDisconnect() {
    this._client   = null;
    this._scanning = false;
    this._devices.clear();
    this._deviceList.innerHTML = '';
    this._setStatus('Disconnected');
    this._connectBtn.textContent = 'Connect';
    this._connectBtn.disabled    = false;
    this._connectBtn.classList.remove('bp-btn--connected');
    this._scanBtn.disabled       = true;
    this._scanBtn.textContent    = 'Scan';
    this._addressInput.disabled  = false;
  }

  // ── Scanning ────────────────────────────────────────────────────────────────

  async _toggleScan() {
    if (!this._client) return;
    try {
      if (this._scanning) {
        await this._client.stopScanning();
        this._scanning = false;
        this._scanBtn.textContent = 'Scan';
      } else {
        await this._client.startScanning();
        this._scanning = true;
        this._scanBtn.textContent = 'Stop';
      }
    } catch (_) { /* no-op */ }
  }

  _onScanningFinished() {
    this._scanning = false;
    this._scanBtn.textContent = 'Scan';
  }

  // ── Device management ───────────────────────────────────────────────────────

  _onDeviceAdded(device) {
    this._devices.set(device.index, device);
    this._renderDevice(device);
  }

  _onDeviceRemoved(device) {
    this._devices.delete(device.index);
    const el = document.getElementById(`bp-dev-${device.index}`);
    if (el) el.remove();
    if (!this._devices.size) {
      this._setStatus('Connected – no devices');
    }
  }

  _renderDevice(device) {
    if (document.getElementById(`bp-dev-${device.index}`)) return;

    const canVibrate   = device.vibrateAttributes.length > 0;
    const canRotate    = device.rotateAttributes.length > 0;
    const canOscillate = device.oscillateAttributes.length > 0;

    const card = document.createElement('div');
    card.className = 'bp-device-card';
    card.id        = `bp-dev-${device.index}`;

    card.innerHTML = `
      <div class="bp-device-name">${this._esc(device.name)}</div>
      <div class="bp-device-caps">
        ${canVibrate   ? '<span class="bp-cap">Vibrate</span>'   : ''}
        ${canRotate    ? '<span class="bp-cap">Rotate</span>'    : ''}
        ${canOscillate ? '<span class="bp-cap">Oscillate</span>' : ''}
      </div>
      ${canVibrate ? `
        <div class="bp-control-row">
          <label class="bp-label" for="bp-sl-${device.index}">Intensity</label>
          <input  class="bp-slider" type="range" min="0" max="100" value="0"
                  id="bp-sl-${device.index}" aria-label="Vibration intensity" />
          <span   class="bp-slider-val" id="bp-sv-${device.index}">0%</span>
        </div>
      ` : ''}
      <button class="bp-stop-btn" id="bp-stop-${device.index}" type="button">
        &#9632; Stop
      </button>
    `;

    this._deviceList.appendChild(card);
    this._setStatus(`Connected – ${this._devices.size} device(s)`);

    if (canVibrate) {
      const slider = document.getElementById(`bp-sl-${device.index}`);
      const valEl  = document.getElementById(`bp-sv-${device.index}`);

      slider.addEventListener('input', async () => {
        const pct = parseInt(slider.value, 10) / 100;
        valEl.textContent = `${Math.round(pct * 100)}%`;
        try {
          await device.vibrate(pct);
        } catch (_) { /* device may have disconnected */ }
      });
    }

    const stopBtn = document.getElementById(`bp-stop-${device.index}`);
    stopBtn.addEventListener('click', async () => {
      const slider = document.getElementById(`bp-sl-${device.index}`);
      const valEl  = document.getElementById(`bp-sv-${device.index}`);
      if (slider) { slider.value = '0'; }
      if (valEl)  { valEl.textContent = '0%'; }
      try { await device.stop(); } catch (_) { /* ignore */ }
    });
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Initialise after DOM and buttplug library are both ready
function initButtplugPanel() {
  if (typeof window.Buttplug === 'undefined') {
    // Library failed to load – show a static error in the panel status
    const s = document.getElementById('bp-status');
    if (s) s.textContent = 'Library unavailable';
    return;
  }
  window._bpPanel = new ButtplugPanel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initButtplugPanel);
} else {
  initButtplugPanel();
}
