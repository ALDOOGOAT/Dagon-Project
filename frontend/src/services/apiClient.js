import axios from 'axios';
import { apiUrl } from '../config/api';

const apiClient = axios.create({
  baseURL: apiUrl(''),
});

const GET_CACHE_TTL_MS = 15_000;
const responseCache = new Map();
const pendingGets = new Map();

const stableStringify = (value) => {
  if (!value || typeof value !== 'object') return '';
  return JSON.stringify(Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = value[key];
    return acc;
  }, {}));
};

const buildCacheKey = (url, config = {}) => {
  const paramsKey = stableStringify(config.params);
  const tokenKey = typeof window !== 'undefined'
    ? (window.localStorage.getItem('token') || '').slice(-16)
    : '';
  return `${String(url)}::${paramsKey}::${tokenKey}`;
};

export const invalidateApiCache = (prefix = '') => {
  for (const key of responseCache.keys()) {
    if (!prefix || key.includes(prefix)) responseCache.delete(key);
  }
  for (const key of pendingGets.keys()) {
    if (!prefix || key.includes(prefix)) pendingGets.delete(key);
  }
};

export const cachedGet = (url, config = {}, options = {}) => {
  const ttl = options.ttl ?? GET_CACHE_TTL_MS;
  const force = Boolean(options.force);
  const key = buildCacheKey(url, config);
  const cached = responseCache.get(key);
  const canReusePending = !config.signal;

  if (!force && cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.response);
  }

  if (canReusePending && !force && pendingGets.has(key)) {
    return pendingGets.get(key);
  }

  const request = apiClient.get(url, config)
    .then((response) => {
      responseCache.set(key, { timestamp: Date.now(), response });
      return response;
    })
    .finally(() => {
      pendingGets.delete(key);
    });

  if (canReusePending) {
    pendingGets.set(key, request);
  }
  return request;
};

// Interceptor para inyectar el token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { ...(config.metadata || {}), startedAt: Date.now() };
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globales (401, 403)
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (method && method !== 'get') {
      invalidateApiCache();
    }

    if (process.env.NODE_ENV === 'development') {
      const serverMs = response.headers?.['x-dagon-response-time-ms'];
      const clientMs = response.config?.metadata?.startedAt
        ? Date.now() - response.config.metadata.startedAt
        : null;
      if (serverMs || clientMs) {
        // Diagnostico local compacto para detectar pantallas lentas sin exponer payloads.
        console.debug('[Dagon API]', method?.toUpperCase(), response.config?.url, {
          serverMs: serverMs ? Number(serverMs) : undefined,
          clientMs,
        });
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('dagon_user_cache');

      window.dispatchEvent(new Event('dagon_unauthorized'));

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
