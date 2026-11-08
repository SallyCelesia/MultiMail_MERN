import { getStoredAuthToken } from './authToken';

export {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken,
} from './authToken';

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:5000'
    : 'https://multimail-mern.onrender.com')
).replace(/\/+$/, '');

const request = async (endpoint, options = {}) => {
  const { token, timeoutMs, ...fetchOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...fetchOptions,
      ...(controller ? { signal: controller.signal } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Gmail verification timed out. Check the backend connection to Gmail and try again.');
    }
    throw new Error(
      'Could not reach the API. Check the API URL, backend availability, and that this frontend origin is allowed by Backend FRONTEND_ORIGIN.',
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    const error = new Error(result.error || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return result;
};

export const signUp = (details) =>
  request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(details),
  });

export const logIn = (credentials) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const fetchCurrentUser = (token) =>
  request('/api/auth/me', { token });

export const configureSmtpSession = (password) =>
  request('/smtp/session', {
    method: 'POST',
    token: getStoredAuthToken(),
    timeoutMs: 30_000,
    body: JSON.stringify({ password }),
  });

export const endAuthSession = () =>
  request('/logout', {
    method: 'POST',
    token: getStoredAuthToken(),
  });
