'use strict';

/**
 * Patreon OAuth2 + Webhook integration
 *
 * GET  /api/patreon/auth?session=<sessionToken>
 *      Redirect the user's browser to Patreon's OAuth consent screen.
 *      The sessionToken is passed as `state` so the callback can match the
 *      Patreon identity to the existing chat User.
 *
 * GET  /api/patreon/callback?code=…&state=<sessionToken>
 *      Patreon redirects here after the user authorises.
 *      Exchanges the code for tokens, fetches identity + membership, stores
 *      the result on the User document, then redirects back to the app.
 *
 * GET  /api/patreon/status?session=<sessionToken>
 *      Returns the current patron status for a given chat session.
 *
 * POST /api/patreon/webhook
 *      Receives real-time membership events from Patreon.
 *      Verifies the X-Patreon-Signature HMAC-MD5 header before processing.
 *
 * Required .env vars:
 *   PATREON_CLIENT_ID
 *   PATREON_CLIENT_SECRET
 *   PATREON_REDIRECT_URI   e.g. https://yoursite.com/api/patreon/callback
 *   PATREON_WEBHOOK_SECRET  (the "secret" returned when you create a webhook)
 *   APP_BASE_URL            e.g. https://yoursite.com
 */

const express = require('express');
const https   = require('https');
const crypto  = require('crypto');
const { URL, URLSearchParams } = require('url');
const User    = require('../models/User');

const router = express.Router();

const PATREON_SITE = 'https://www.patreon.com';
const PATREON_API  = 'https://www.patreon.com/api/oauth2/v2';

// Tier ID → display name map (populated from env at startup)
function getTierNames() {
  return {
    [process.env.PATREON_TIER_GOOD_GIRL]:      'Good Girl',
    [process.env.PATREON_TIER_PINK_POODLE]:    'Pink Poodle',
    [process.env.PATREON_TIER_AIRHEAD_BARBIE]: 'Airhead Barbie',
  };
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

/** GET a Patreon API v2 path using an OAuth access token. */
function patreonGet(path, accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `${PATREON_API}${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent':  'BambiSleepChurch - Chat App',
          Accept:        'application/json',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
          catch { reject(new Error(`Patreon GET ${path}: invalid JSON`)); }
        });
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Patreon GET timeout')));
    req.end();
  });
}

/** POST to a Patreon URL with url-encoded body (used for token exchange). */
function patreonTokenPost(params) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(new URLSearchParams(params).toString(), 'utf8');
    const parsed  = new URL(`${PATREON_SITE}/api/oauth2/token`);

    const req = https.request(
      {
        hostname: parsed.hostname,
        path:     parsed.pathname,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/x-www-form-urlencoded',
          'Content-Length': payload.length,
          'User-Agent':     'BambiSleepChurch - Chat App',
          Accept:           'application/json',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
          catch { reject(new Error('Patreon token exchange: invalid JSON')); }
        });
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Patreon POST timeout')));
    req.write(payload);
    req.end();
  });
}

// ── GET /api/patreon/auth ──────────────────────────────────────────────────────
router.get('/auth', (req, res) => {
  const sessionToken = (req.query.session || '').trim();
  if (!sessionToken) return res.status(400).send('Missing session token');

  const clientId    = process.env.PATREON_CLIENT_ID;
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(503).send('Patreon integration not configured');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  redirectUri,
    // Request identity (public profile), email, and membership info
    scope:         'identity identity[email] campaigns.members',
    state:         sessionToken,
  });

  return res.redirect(`${PATREON_SITE}/oauth2/authorize?${params}`);
});

// ── Popup close helper ───────────────────────────────────────────────────────
// Serves a minimal HTML page that posts a message to the opener and closes
// itself.  Falls back to a full redirect when opened outside a popup.
function sendPopupClose(res, result, appBase) {
  const VALID = ['linked', 'denied', 'error'];
  const safeResult = VALID.includes(result) ? result : 'error';
  return res.type('html').send(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Patreon</title></head>` +
    `<body><script>` +
    `(function(){` +
    `  var r=${JSON.stringify(safeResult)};` +
    `  if(window.opener&&!window.opener.closed){` +
    `    window.opener.postMessage({type:'patreon:oauth',result:r},location.origin);` +
    `    window.close();` +
    `  } else {` +
    `    location.href=${JSON.stringify(appBase + '/?patreon=' + safeResult)};` +
    `  }` +
    `}())` +
    `<\/script></body></html>`
  );
}

// ── GET /api/patreon/callback ──────────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, state: sessionToken, error } = req.query;
  const appBase = (process.env.APP_BASE_URL || '').replace(/\/+$/, '');

  if (error || !code || !sessionToken) {
    return sendPopupClose(res, 'denied', appBase);
  }

  try {
    // 1. Exchange authorisation code for access + refresh tokens
    const tokenData = await patreonTokenPost({
      code,
      grant_type:    'authorization_code',
      client_id:     process.env.PATREON_CLIENT_ID,
      client_secret: process.env.PATREON_CLIENT_SECRET,
      redirect_uri:  process.env.PATREON_REDIRECT_URI,
    });

    if (!tokenData.access_token) {
      console.error('[patreon] token exchange failed:', tokenData);
      return sendPopupClose(res, 'error', appBase);
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const tokenExpiry = new Date(Date.now() + (expires_in || 3600) * 1000);

    // 2. Fetch user identity + memberships + entitled tiers from Patreon API v2
    //    All fields must be explicitly requested.
    const identityPath =
      '/identity' +
      '?include=memberships%2Cmemberships.currently_entitled_tiers' +
      '&fields%5Buser%5D=full_name%2Cemail%2Cthumb_url' +
      '&fields%5Bmember%5D=patron_status%2Ccurrently_entitled_amount_cents%2Clast_charge_status' +
      '&fields%5Btier%5D=title%2Camount_cents';

    const identity = await patreonGet(identityPath, access_token);
    const patreonUserId = identity.data?.id;

    if (!patreonUserId) {
      console.error('[patreon] identity missing id:', identity);
      return sendPopupClose(res, 'error', appBase);
    }

    const attrs    = identity.data?.attributes || {};
    const fullName = attrs.full_name || '';
    const thumbUrl = attrs.thumb_url || '';

    // 3. Extract membership status and tier
    const memberships = (identity.included || []).filter((r) => r.type === 'member');
    let patronStatus  = null;
    let amountCents   = 0;
    let tierId        = null;
    let tierName      = null;

    if (memberships.length > 0) {
      const best = memberships.find(
        (m) => m.attributes?.patron_status === 'active_patron',
      ) || memberships[0];
      patronStatus = best.attributes?.patron_status || null;
      amountCents  = best.attributes?.currently_entitled_amount_cents || 0;

      // Resolve tier from the included resources
      const entitledTierIds = (best.relationships?.currently_entitled_tiers?.data || [])
        .map((t) => t.id);
      if (entitledTierIds.length > 0) {
        tierId = entitledTierIds[0];
        tierName = getTierNames()[tierId] || null;
      }
    }

    // 4. Persist to the User document that matches the chat session token
    const updated = await User.findOneAndUpdate(
      { sessionToken },
      {
        $set: {
          'patreon.userId':                       patreonUserId,
          'patreon.accessToken':                  access_token,
          'patreon.refreshToken':                 refresh_token || null,
          'patreon.tokenExpiry':                  tokenExpiry,
          'patreon.patronStatus':                 patronStatus,
          'patreon.currentlyEntitledAmountCents': amountCents,
          'patreon.tierId':                       tierId,
          'patreon.tierName':                     tierName,
          'patreon.fullName':                     fullName,
          'patreon.thumbUrl':                     thumbUrl,
          'patreon.linkedAt':                     new Date(),
        },
      },
      { new: false },
    );

    if (!updated) {
      // Session not found — still send success close so popup doesn't hang
      console.warn('[patreon] callback: no user found for sessionToken');
    }

    return sendPopupClose(res, 'linked', appBase);
  } catch (err) {
    console.error('[patreon] callback error:', err.message);
    return sendPopupClose(res, 'error', appBase);
  }
});

// ── GET /api/patreon/status ────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  const sessionToken = (req.query.session || '').trim();
  if (!sessionToken) return res.status(400).json({ error: 'Missing session token' });

  try {
    const user = await User.findOne({ sessionToken }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const p = user.patreon || {};
    return res.json({
      linked:         !!p.userId,
      patronStatus:   p.patronStatus  || null,
      amountCents:    p.currentlyEntitledAmountCents || 0,
      tierId:         p.tierId        || null,
      tierName:       p.tierName      || null,
      fullName:       p.fullName      || null,
      thumbUrl:       p.thumbUrl      || null,
      isActivePatron: p.patronStatus  === 'active_patron',
    });
  } catch (err) {
    console.error('[patreon] status error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ── POST /api/patreon/unlink ───────────────────────────────────────────────────
// Removes stored Patreon data from the User document.
router.post('/unlink', async (req, res) => {
  const sessionToken = (req.query.session || '').trim();
  if (!sessionToken) return res.status(400).json({ error: 'Missing session token' });

  try {
    await User.findOneAndUpdate(
      { sessionToken },
      {
        $set: {
          'patreon.userId':                       null,
          'patreon.accessToken':                  null,
          'patreon.refreshToken':                 null,
          'patreon.tokenExpiry':                  null,
          'patreon.patronStatus':                 null,
          'patreon.currentlyEntitledAmountCents': 0,
          'patreon.fullName':                     null,
          'patreon.thumbUrl':                     null,
          'patreon.linkedAt':                     null,
        },
      },
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[patreon] unlink error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ── POST /api/patreon/webhook ──────────────────────────────────────────────────
// Raw body is required to verify the HMAC-MD5 signature.
// express.raw() is applied only to this route — it takes precedence over the
// global express.json() because it is registered here explicitly.
router.post(
  '/webhook',
  express.raw({ type: '*/*' }),
  async (req, res) => {
    const secret    = process.env.PATREON_WEBHOOK_SECRET || '';
    const sigHeader = (req.headers['x-patreon-signature'] || '').toLowerCase();

    // Always respond 200 quickly; compute signature before any async work
    if (secret) {
      const expected = crypto
        .createHmac('md5', secret)
        .update(req.body)
        .digest('hex');

      const sigBuf  = Buffer.from(sigHeader.padEnd(expected.length, ' '));
      const expBuf  = Buffer.from(expected);

      // Use timingSafeEqual only when lengths match
      const valid = sigBuf.length === expBuf.length
        ? crypto.timingSafeEqual(sigBuf, expBuf)
        : sigHeader === expected;

      if (!valid) {
        console.warn('[patreon] webhook: bad signature');
        return res.status(401).send('Bad signature');
      }
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).send('Bad JSON');
    }

    const member = payload.data;
    if (member?.type !== 'member') {
      return res.status(200).send('ignored');
    }

    const patreonUserId = member.relationships?.user?.data?.id;
    const patronStatus  = member.attributes?.patron_status || null;
    const amountCents   = member.attributes?.currently_entitled_amount_cents ?? 0;
    const eventType     = req.headers['x-patreon-event'] || '';

    // Resolve tier from the webhook's included resources
    const entitledTierData = (member.relationships?.currently_entitled_tiers?.data || []);
    const webhookTierId    = entitledTierData.length > 0 ? entitledTierData[0].id : null;
    const webhookTierName  = webhookTierId ? (getTierNames()[webhookTierId] || null) : null;

    // On delete events, clear patron status and tier
    const finalStatus   = eventType === 'members:delete' ? 'former_patron' : patronStatus;
    const finalTierId   = eventType === 'members:delete' ? null : webhookTierId;
    const finalTierName = eventType === 'members:delete' ? null : webhookTierName;

    if (patreonUserId) {
      try {
        await User.updateMany(
          { 'patreon.userId': patreonUserId },
          {
            $set: {
              'patreon.patronStatus':                 finalStatus,
              'patreon.currentlyEntitledAmountCents': amountCents,
              'patreon.tierId':                       finalTierId,
              'patreon.tierName':                     finalTierName,
            },
          },
        );
      } catch (err) {
        // Log but don't leak error to Patreon's retry logic
        console.error('[patreon] webhook DB error:', err.message);
      }
    }

    return res.status(200).send('ok');
  },
);

module.exports = router;
