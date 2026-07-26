'use client';

/**
 * Tracker da landing page.
 *
 * Roda SÓ no navegador e SÓ na LP (é iniciado no app/page.js). Mede quem entrou,
 * quando, de onde (UTM/referrer), o dispositivo, quanto tempo ficou, o que
 * clicou e se começou/abandonou uma compra. Quando a pessoa digita nome/e-mail,
 * o `identify` liga o IP dela a esses dados no servidor.
 *
 * Os eventos são acumulados e enviados em lote — periodicamente, quando a aba
 * some e no fechamento (via sendBeacon, que sobrevive à navegação). O IP e o
 * parsing de user-agent são feitos no servidor.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1';

const COLLECT_URL = `${API_BASE}/analytics/collect`;

const VID_KEY = 'bp_vid';        // id do visitante (persiste entre sessões)
const SID_KEY = 'bp_sid';        // id da sessão (sessionStorage)
const CTX_KEY = 'bp_ctx';        // contexto da sessão (sessionStorage)
const IDENT_KEY = 'bp_ident';    // último e-mail identificado (evita reenvio)

const HEARTBEAT_MS = 15000;
const FLUSH_MS = 8000;

let queue = [];
let started = false;
let flushTimer = null;
let heartbeatTimer = null;

const isBrowser = () => typeof window !== 'undefined';

const uuid = () => {
  if (isBrowser() && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxxyxxxxyxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }) + Date.now().toString(16);
};

const safeGet = (storage, key) => {
  try { return window[storage].getItem(key); } catch { return null; }
};
const safeSet = (storage, key, value) => {
  try { window[storage].setItem(key, value); } catch { /* storage indisponível */ }
};

const getVisitorId = () => {
  let id = safeGet('localStorage', VID_KEY);
  if (!id) { id = uuid(); safeSet('localStorage', VID_KEY, id); }
  return id;
};

const getSessionId = () => {
  let id = safeGet('sessionStorage', SID_KEY);
  if (!id) { id = uuid(); safeSet('sessionStorage', SID_KEY, id); }
  return id;
};

// Contexto capturado uma vez por sessão: origem do tráfego + ambiente.
const getContext = () => {
  const cached = safeGet('sessionStorage', CTX_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* recria abaixo */ }
  }
  const params = new URLSearchParams(window.location.search);
  const ctx = {
    startedAt: new Date().toISOString(),
    landingPath: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmTerm: params.get('utm_term'),
    utmContent: params.get('utm_content'),
    screenSize: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    language: navigator.language || null
  };
  safeSet('sessionStorage', CTX_KEY, JSON.stringify(ctx));
  return ctx;
};

const buildPayload = (events) => ({
  visitorId: getVisitorId(),
  sessionId: getSessionId(),
  context: getContext(),
  events
});

const send = (events, useBeacon = false) => {
  if (!events.length) return;
  const body = JSON.stringify(buildPayload(events));
  try {
    if (useBeacon && navigator.sendBeacon) {
      // text/plain: não dispara preflight de CORS e sobrevive ao unload.
      navigator.sendBeacon(COLLECT_URL, new Blob([body], { type: 'text/plain' }));
      return;
    }
    fetch(COLLECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      keepalive: true
    }).catch(() => {});
  } catch { /* best-effort */ }
};

const flush = (useBeacon = false) => {
  if (!queue.length) return;
  const batch = queue;
  queue = [];
  send(batch, useBeacon);
};

const enqueue = (type, name = null, metadata = null, { immediate = false } = {}) => {
  if (!isBrowser()) return;
  queue.push({
    type,
    name: name || null,
    path: window.location.pathname,
    metadata: metadata || null,
    occurredAt: new Date().toISOString()
  });
  if (immediate || queue.length >= 15) flush(false);
};

// ── API pública ───────────────────────────────────────────────

export const trackEvent = (type, name, metadata) => enqueue(type, name, metadata);
export const trackView = (name, metadata) => enqueue('pageview', name, metadata);
export const trackClick = (name, metadata) => enqueue('click', name, metadata);
export const trackCheckoutStart = (metadata) => enqueue('checkout_start', 'Checkout iniciado', metadata, { immediate: true });
export const trackPurchase = (metadata) => enqueue('purchase', 'Compra concluída', metadata, { immediate: true });

/**
 * Liga o visitante (e o IP dele) a um nome/e-mail. Chamar quando a pessoa
 * preenche esses dados. Só reenvia se o e-mail mudou, para não repetir.
 */
export const identify = ({ name, email, phone } = {}) => {
  if (!isBrowser()) return;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (cleanEmail && safeGet('localStorage', IDENT_KEY) === cleanEmail && !name && !phone) return;
  if (cleanEmail) safeSet('localStorage', IDENT_KEY, cleanEmail);
  enqueue('identify', 'Identificação', {
    name: name || null,
    email: cleanEmail || null,
    phone: phone || null
  }, { immediate: true });
};

/** Inicia o tracker: pageview inicial, heartbeats e flush no fechamento. */
export const initTracker = () => {
  if (started || !isBrowser()) return;
  started = true;

  getContext(); // fixa o contexto da sessão já na entrada
  enqueue('pageview', document.title || 'Landing', null, { immediate: true });

  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === 'visible') enqueue('heartbeat');
  }, HEARTBEAT_MS);

  flushTimer = setInterval(() => flush(false), FLUSH_MS);

  // Aba some / fecha: manda o que sobrou via beacon (sobrevive à navegação).
  const onHide = () => flush(true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
  window.addEventListener('pagehide', onHide);
  window.addEventListener('beforeunload', onHide);
};

export const stopTracker = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (flushTimer) clearInterval(flushTimer);
  flush(true);
  started = false;
};
