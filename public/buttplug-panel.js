'use strict';

// Buttplug v3 browser integration
// Requires Intiface Central running locally: https://intiface.com/central
// Library loaded from CDN: buttplug@3.x UMD bundle (global: window.Buttplug)

const BP_ADDR_KEY = 'bp_ws_address';
const BP_DEFAULT  = 'ws://localhost:12345';

// Built-in haptic patterns [name, steps: [{intensity 0-1, durationMs}]]
const BP_PATTERNS = {
  pulse:  [{ i: 0.8, d: 200 }, { i: 0, d: 100 }, { i: 0.8, d: 200 }, { i: 0, d: 100 }],
  wave:   [{ i: 0.2, d: 150 }, { i: 0.5, d: 150 }, { i: 0.9, d: 200 }, { i: 0.5, d: 150 }, { i: 0, d: 100 }],
  surge:  [{ i: 0.1, d: 80 }, { i: 0.3, d: 80 }, { i: 0.6, d: 100 }, { i: 1.0, d: 300 }, { i: 0, d: 200 }],
  tease:  [{ i: 0.6, d: 120 }, { i: 0, d: 80 }, { i: 0.6, d: 120 }, { i: 0, d: 80 }, { i: 0.9, d: 400 }, { i: 0, d: 200 }],
  throb:  [{ i: 0.4, d: 300 }, { i: 0.1, d: 200 }, { i: 0.7, d: 300 }, { i: 0.1, d: 200 }, { i: 1.0, d: 400 }, { i: 0, d: 300 }],
};

class ButtplugPanel {
  constructor() {
    this._client      = null;
    this._devices     = new Map();   // deviceIndex → ButtplugClientDevice
    this._scanning    = false;
    this._patternLoop = null;        // setInterval handle for looping patterns

    // DOM refs
    this._addressInput = document.getElementById('bp-address');
    this._connectBtn   = document.getElementById('bp-connect-btn');
    this._scanBtn      = document.getElementById('bp-scan-btn');
    this._deviceList   = document.getElementById('bp-device-list');
    this._statusEl     = document.getElementById('bp-status');
    this._panelToggle  = document.getElementById('bp-panel-toggle');
    this._panelBody    = document.getElementById('bp-panel-body');

    if (!this._addressInput) return;

    const saved = localStorage.getItem(BP_ADDR_KEY);
    if (saved) this._addressInput.value = saved;

    this._connectBtn.addEventListener('click', () => this._toggleConnect());
    this._scanBtn.addEventListener('click',    () => this._toggleScan());
    this._panelToggle.addEventListener('click', () => this._togglePanel());

    // Pattern picker (injected into panel body)
    this._injectPatternPicker();

    // Help modal
    const helpBtn  = document.getElementById('bp-help-btn');
    const modal    = document.getElementById('bp-help-modal');
    const closeBtn = document.getElementById('bp-modal-close');
    if (helpBtn && modal && closeBtn) {
      helpBtn.addEventListener('click',  () => { modal.hidden = false; closeBtn.focus(); });
      closeBtn.addEventListener('click', () => { modal.hidden = true;  helpBtn.focus(); });
      modal.addEventListener('click',    (e) => { if (e.target === modal) { modal.hidden = true; helpBtn.focus(); } });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; helpBtn.focus(); }
      });
    }
  }

  // ── Pattern picker UI ────────────────────────────────────────────────────────

  _injectPatternPicker() {
    const wrap = document.createElement('div');
    wrap.className = 'bp-pattern-section';
    wrap.innerHTML = `
      <div class="bp-section-label">Haptic Patterns</div>
      <div class="bp-pattern-row" id="bp-pattern-row">
        ${Object.keys(BP_PATTERNS).map((name) =>
          `<button class="bp-pattern-btn" data-pattern="${name}" type="button">${name}</button>`
        ).join('')}
        <button class="bp-pattern-btn bp-pattern-stop" id="bp-pattern-stop" type="button" disabled>&#9632; stop</button>
      </div>
      <div class="bp-intensity-row">
        <span class="bp-label">Master intensity</span>
        <input class="bp-slider" type="range" min="0" max="100" value="80"
               id="bp-master-intensity" aria-label="Master intensity" />
        <span class="bp-slider-val" id="bp-master-val">80%</span>
      </div>
      <div class="bp-section-label" style="margin-top:10px">All Devices</div>
      <div class="bp-alldev-row">
        <button class="bp-btn bp-alldev-btn" id="bp-alldev-vibrate" type="button" disabled>&#128248; All Vibrate</button>
        <button class="bp-btn bp-alldev-btn" id="bp-alldev-stop"    type="button" disabled>&#9632; All Stop</button>
      </div>
    `;
    // Insert before device list
    const body = this._panelBody;
    const devList = this._deviceList;
    body.insertBefore(wrap, devList);

    // Master intensity
    const masterSlider = document.getElementById('bp-master-intensity');
    const masterVal    = document.getElementById('bp-master-val');
    masterSlider.addEventListener('input', () => {
      masterVal.textContent = `${masterSlider.value}%`;
    });

    // Pattern buttons
    document.getElementById('bp-pattern-row').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pattern]');
      if (btn) this._runPattern(btn.dataset.pattern, parseInt(masterSlider.value, 10) / 100);
    });
    document.getElementById('bp-pattern-stop').addEventListener('click', () => this._stopPattern());

    // All-device controls
    document.getElementById('bp-alldev-vibrate').addEventListener('click', () => {
      const pct = parseInt(masterSlider.value, 10) / 100;
      this._allVibrate(pct);
    });
    document.getElementById('bp-alldev-stop').addEventListener('click', () => {
      this._allStop();
    });
  }

  _setAllDevBtns(enabled) {
    const v = document.getElementById('bp-alldev-vibrate');
    const s = document.getElementById('bp-alldev-stop');
    if (v) v.disabled = !enabled;
    if (s) s.disabled = !enabled;
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
      this._client.addListener('scanningfinished', ()  => this._onScanningFinished());
      this._client.addListener('disconnect',       ()  => this._onServerDisconnect());
      const connector = new window.Buttplug.ButtplugBrowserWebsocketClientConnector(address);
      await this._client.connect(connector);
      this._setStatus('Connected');
      this._connectBtn.textContent = 'Disconnect';
      this._connectBtn.disabled    = false;
      this._connectBtn.classList.add('bp-btn--connected');
      this._scanBtn.disabled       = false;
      this._addressInput.disabled  = true;
      this._setAllDevBtns(true);
    } catch (err) {
      this._setStatus(`Failed: ${err.message || 'Could not connect'}`);
      this._connectBtn.disabled = false;
      this._client = null;
    }
  }

  async _disconnect() {
    if (!this._client) return;
    this._stopPattern();
    try { await this._client.disconnect(); } catch (_) { /* ignore */ }
    this._onServerDisconnect();
  }

  _onServerDisconnect() {
    this._stopPattern();
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
    this._setAllDevBtns(false);
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
    this._setStatus(`Connected – ${this._devices.size} device(s)`);
  }

  _renderDevice(device) {
    if (document.getElementById(`bp-dev-${device.index}`)) return;

    const canVibrate   = device.vibrateAttributes.length   > 0;
    const canRotate    = device.rotateAttributes.length    > 0;
    const canOscillate = device.oscillateAttributes.length > 0;
    const numVibrators = device.vibrateAttributes.length;

    const card = document.createElement('div');
    card.className = 'bp-device-card';
    card.id        = `bp-dev-${device.index}`;

    // Build per-actuator sliders for multi-actuator devices
    const actuatorSliders = canVibrate && numVibrators > 1
      ? Array.from({ length: numVibrators }, (_, i) => `
          <div class="bp-control-row">
            <label class="bp-label" for="bp-sl-${device.index}-${i}">Motor ${i + 1}</label>
            <input  class="bp-slider" type="range" min="0" max="100" value="0"
                    id="bp-sl-${device.index}-${i}" aria-label="Motor ${i + 1} intensity" />
            <span   class="bp-slider-val" id="bp-sv-${device.index}-${i}">0%</span>
          </div>`).join('')
      : canVibrate ? `
          <div class="bp-control-row">
            <label class="bp-label" for="bp-sl-${device.index}">Intensity</label>
            <input  class="bp-slider" type="range" min="0" max="100" value="0"
                    id="bp-sl-${device.index}" aria-label="Vibration intensity" />
            <span   class="bp-slider-val" id="bp-sv-${device.index}">0%</span>
          </div>` : '';

    card.innerHTML = `
      <div class="bp-device-name">${this._esc(device.name)}</div>
      <div class="bp-device-caps">
        ${canVibrate   ? `<span class="bp-cap">Vibrate${numVibrators > 1 ? ` ×${numVibrators}` : ''}</span>` : ''}
        ${canRotate    ? '<span class="bp-cap">Rotate</span>'    : ''}
        ${canOscillate ? '<span class="bp-cap">Oscillate</span>' : ''}
      </div>
      ${actuatorSliders}
      <div class="bp-device-actions">
        ${Object.keys(BP_PATTERNS).map((p) =>
          `<button class="bp-pattern-btn bp-pattern-btn--sm" data-dev="${device.index}" data-pattern="${p}" type="button">${p}</button>`
        ).join('')}
        <button class="bp-stop-btn" id="bp-stop-${device.index}" type="button">&#9632; Stop</button>
      </div>
    `;

    this._deviceList.appendChild(card);
    this._setStatus(`Connected – ${this._devices.size} device(s)`);

    // Single-motor slider
    if (canVibrate && numVibrators === 1) {
      const slider = document.getElementById(`bp-sl-${device.index}`);
      const valEl  = document.getElementById(`bp-sv-${device.index}`);
      slider.addEventListener('input', async () => {
        const pct = parseInt(slider.value, 10) / 100;
        valEl.textContent = `${Math.round(pct * 100)}%`;
        try { await device.vibrate(pct); } catch (_) { /* ignore */ }
      });
    }

    // Multi-motor sliders
    if (canVibrate && numVibrators > 1) {
      for (let i = 0; i < numVibrators; i++) {
        const sl  = document.getElementById(`bp-sl-${device.index}-${i}`);
        const sv  = document.getElementById(`bp-sv-${device.index}-${i}`);
        const idx = i;
        sl.addEventListener('input', async () => {
          const pct = parseInt(sl.value, 10) / 100;
          sv.textContent = `${Math.round(pct * 100)}%`;
          try {
            // Build speed array for all motors, only changing this one
            const speeds = Array.from({ length: numVibrators }, (_, j) => {
              const sj = document.getElementById(`bp-sl-${device.index}-${j}`);
              return sj ? parseInt(sj.value, 10) / 100 : 0;
            });
            await device.vibrate(speeds);
          } catch (_) { /* ignore */ }
        });
      }
    }

    // Per-device pattern buttons
    card.querySelectorAll('[data-pattern][data-dev]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const master = parseInt(document.getElementById('bp-master-intensity')?.value || '80', 10) / 100;
        this._runPatternOnDevice(device, btn.dataset.pattern, master);
      });
    });

    // Stop button
    document.getElementById(`bp-stop-${device.index}`)
      .addEventListener('click', async () => {
        this._resetDeviceSliders(device.index, numVibrators);
        try { await device.stop(); } catch (_) { /* ignore */ }
      });
  }

  _resetDeviceSliders(devIdx, numVibrators) {
    if (numVibrators > 1) {
      for (let i = 0; i < numVibrators; i++) {
        const sl = document.getElementById(`bp-sl-${devIdx}-${i}`);
        const sv = document.getElementById(`bp-sv-${devIdx}-${i}`);
        if (sl) sl.value = '0';
        if (sv) sv.textContent = '0%';
      }
    } else {
      const sl = document.getElementById(`bp-sl-${devIdx}`);
      const sv = document.getElementById(`bp-sv-${devIdx}`);
      if (sl) sl.value = '0';
      if (sv) sv.textContent = '0%';
    }
  }

  // ── Pattern engine ───────────────────────────────────────────────────────────

  /** Play a named pattern on ALL connected devices. */
  async _runPattern(patternName, masterIntensity = 0.8) {
    const steps = BP_PATTERNS[patternName];
    if (!steps) return;
    this._stopPattern();
    document.getElementById('bp-pattern-stop').disabled = false;
    document.querySelectorAll('[data-pattern]').forEach((b) => b.classList.remove('bp-pattern-active'));
    document.querySelectorAll(`[data-pattern="${patternName}"]`).forEach((b) => b.classList.add('bp-pattern-active'));

    const run = async () => {
      for (const step of steps) {
        const intensity = Math.min(1, step.i * masterIntensity * (1 / 0.8));
        await this._allVibrate(intensity);
        await this._sleep(step.d);
      }
      await this._allStop();
    };
    await run();
  }

  /** Play a named pattern on a single device. */
  async _runPatternOnDevice(device, patternName, masterIntensity = 0.8) {
    const steps = BP_PATTERNS[patternName];
    if (!steps || !device) return;
    const numV = device.vibrateAttributes.length;
    if (!numV) return;
    for (const step of steps) {
      const intensity = Math.min(1, step.i * (masterIntensity / 0.8));
      try { await device.vibrate(intensity); } catch (_) { /* ignore */ }
      await this._sleep(step.d);
    }
    try { await device.stop(); } catch (_) { /* ignore */ }
    this._resetDeviceSliders(device.index, numV);
  }

  _stopPattern() {
    document.querySelectorAll('[data-pattern]').forEach((b) => b.classList.remove('bp-pattern-active'));
    const stopBtn = document.getElementById('bp-pattern-stop');
    if (stopBtn) stopBtn.disabled = true;
    this._allStop();
  }

  // ── All-device helpers ───────────────────────────────────────────────────────

  async _allVibrate(intensity) {
    for (const device of this._devices.values()) {
      if (device.vibrateAttributes.length > 0) {
        try { await device.vibrate(intensity); } catch (_) { /* ignore */ }
      }
    }
  }

  async _allStop() {
    for (const device of this._devices.values()) {
      try { await device.stop(); } catch (_) { /* ignore */ }
    }
    // Reset all sliders
    this._devices.forEach((_, idx) => {
      const d = this._devices.get(idx);
      if (d) this._resetDeviceSliders(idx, d.vibrateAttributes.length);
    });
  }

  // ── Public API (callable from chat.js) ──────────────────────────────────────

  /** One-shot pulse at given intensity for durationMs (e.g. on @mention). */
  async pulse(intensity = 0.7, durationMs = 350) {
    if (!this._client || !this._devices.size) return;
    await this._allVibrate(Math.min(1, intensity));
    await this._sleep(durationMs);
    await this._allStop();
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  _sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

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


const BP_ADDR_KEY = 'bp_ws_address';
const BP_DEFAULT  = 'ws://localhost:12345';

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
