/* ============================================================
   Demon Cat Contract — signing logic (contract.html)
   Stores a local, in-character acceptance record. Purely
   client-side: no real-world authority, fully revocable.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'bsc.contract.demoncat.v1';

  var form     = document.getElementById('contract-sign');
  var nameEl   = document.getElementById('contract-name');
  var statusEl = document.getElementById('contract-status');
  var submitEl = document.getElementById('contract-submit');
  var checks   = [
    document.getElementById('ack-age'),
    document.getElementById('ack-fiction'),
    document.getElementById('ack-safeword')
  ];

  if (!form) return;

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'contract-status' + (kind ? ' contract-status--' + kind : '');
  }

  function allChecked() {
    return checks.every(function (c) { return c && c.checked; });
  }

  function renderSigned(record) {
    form.classList.add('is-signed');
    submitEl.textContent = 'Contract Signed \uD83D\uDC9D';
    submitEl.disabled = true;
    nameEl.disabled = true;
    checks.forEach(function (c) { if (c) c.disabled = true; });

    var seal = document.getElementById('contract-seal');
    if (!seal) {
      seal = document.createElement('div');
      seal.className = 'contract-signed-seal';
      seal.id = 'contract-seal';
      form.appendChild(seal);
    }
    var when = new Date(record.signedAt).toLocaleString();
    seal.innerHTML =
      'Sealed by <strong>' + escapeHtml(record.name) + '</strong><br>' +
      '<span style="font-size:0.8rem;opacity:0.8">' + when +
      ' &middot; Good girl. \u2014 You may revoke anytime below.</span>';

    var revoke = document.getElementById('contract-revoke');
    if (!revoke) {
      revoke = document.createElement('button');
      revoke.type = 'button';
      revoke.id = 'contract-revoke';
      revoke.className = 'btn-back';
      revoke.style.marginTop = '14px';
      revoke.textContent = 'Revoke this contract';
      revoke.addEventListener('click', revokeContract);
      form.appendChild(revoke);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function revokeContract() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    window.location.reload();
  }

  function loadExisting() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    if (!allChecked()) {
      setStatus('Please tick all three acknowledgements first.', 'error');
      return;
    }
    var name = nameEl.value.trim();
    if (name.length < 2) {
      setStatus('Sign with your Bambi name to seal the contract.', 'error');
      nameEl.focus();
      return;
    }

    var record = { name: name, signedAt: Date.now(), version: 'final-release-1' };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      setStatus('Could not save locally, but your consent is noted for this session.', 'error');
    }
    setStatus('"Repeat the words as I seal your fate\u2026" \u2014 contract signed. \uD83D\uDC9D', 'ok');
    renderSigned(record);
  });

  var existing = loadExisting();
  if (existing && existing.name) {
    renderSigned(existing);
    setStatus('You have already signed this contract.', 'ok');
  }
})();
