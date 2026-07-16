const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1';

// Código que a API devolve quando o plano do usuário não inclui a funcionalidade.
export const PLAN_FEATURE_DENIED_CODE = 'PLAN_FEATURE_DENIED';
export const PLAN_FEATURE_DENIED_EVENT = 'bankerpro:plan-feature-denied';

export async function fetchApi(endpoint, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  let activeToken = token;
  if (!activeToken && typeof window !== 'undefined') {
    activeToken = localStorage.getItem('bankerpro_token');
  }

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      'Erro ao processar requisição';
    const err = new Error(message);
    err.code = data?.error?.code;
    err.status = response.status;

    // Avisar aqui, e não em cada tela, faz o aviso de upgrade valer para
    // qualquer chamada que a API barrar por plano.
    if (err.code === PLAN_FEATURE_DENIED_CODE && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(PLAN_FEATURE_DENIED_EVENT, { detail: { message } })
      );
    }

    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint, config) => fetchApi(endpoint, { ...config, method: 'GET' }),
  post: (endpoint, body, config) => fetchApi(endpoint, { ...config, method: 'POST', body }),
  put: (endpoint, body, config) => fetchApi(endpoint, { ...config, method: 'PUT', body }),
  delete: (endpoint, config) => fetchApi(endpoint, { ...config, method: 'DELETE' }),
};

/**
 * Envia o áudio da negociação para análise. Vai separado do `api.post` porque
 * precisa de multipart/form-data, e não de JSON.
 */
export async function uploadAudioAnalysis(file, { durationSeconds, contexto } = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bankerpro_token') : null;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);
  if (durationSeconds) formData.append('durationSeconds', String(Math.round(durationSeconds)));
  if (contexto) formData.append('contexto', contexto);

  let response;
  try {
    response = await fetch(`${API_BASE}/audio-analysis`, { method: 'POST', headers, body: formData });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(data?.error?.message || data?.message || 'Não foi possível analisar o áudio.');
    err.code = data?.error?.code;
    err.status = response.status;

    // Mesma porta do api.js: um bloqueio por plano abre o convite de upgrade.
    if (err.code === PLAN_FEATURE_DENIED_CODE && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(PLAN_FEATURE_DENIED_EVENT, { detail: { message: err.message } })
      );
    }

    throw err;
  }

  return data?.data || data;
}

export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const rootUrl = API_BASE.replace(/\/api\/v1\/?$/, '');
  return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function uploadFile(file) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bankerpro_token') : null;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData
  });
  
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  
  if (!response.ok) {
    throw new Error(data?.message || 'Erro ao fazer upload do arquivo');
  }
  
  return data?.data?.url || data?.url;
}
