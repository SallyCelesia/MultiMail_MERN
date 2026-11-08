const TOKEN_STORAGE_KEY = 'multimail-auth-token';

export const getStoredAuthToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeAuthToken = (token) => {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredAuthToken = () => {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};
