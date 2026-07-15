const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1';

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
