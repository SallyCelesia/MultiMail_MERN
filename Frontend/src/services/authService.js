import { getStoredAuthToken } from './authToken';

export {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken,
} from './authToken';

const apiBaseUrl = 'https://multimail-mern.onrender.com/'

const request = async (endpoint, options = {}) => {
  const { token, ...fetchOptions } = options;
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new Error('Could not connect to the server. Check that the backend is running.');
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
    body: JSON.stringify({ password }),
  });

export const endAuthSession = () =>
  request('/logout', {
    method: 'POST',
    token: getStoredAuthToken(),
  });
