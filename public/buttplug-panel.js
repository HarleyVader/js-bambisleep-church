'use strict';

// Buttplug v3 browser integration
// Requires Intiface Central running locally: https://intiface.com/central
// Library loaded from CDN: buttplug@3.x UMD bundle (global: window.Buttplug)

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
