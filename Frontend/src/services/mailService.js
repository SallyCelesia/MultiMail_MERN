import { getStoredAuthToken } from './authToken';

const apiBaseUrl = 'https://multimail-mern.onrender.com';

const authHeaders = () => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const postMailRequest = async (endpoint, payload) => {
  let response;

  try {
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not connect to the mail server. Check that the backend is running.');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The mail server returned an invalid response.');
  }

  if (!response.ok && response.status !== 207) {
    const error = new Error(result.error || 'The mail server could not send the message.');
    error.status = response.status;
    throw error;
  }

  return result;
};

export const sendBulkEmail = (payload) => postMailRequest('/send', payload);


export const fetchMailMessages = async () => {
  let response;
  try {
    response = await fetch(`${apiBaseUrl}/messages`, { headers: authHeaders() });
  } catch {
    throw new Error('Could not connect to the mail server. Check that the backend is running.');
  }

  if (!response.ok) {
    const error = new Error('The mail server could not load message folders.');
    error.status = response.status;
    throw error;
  }
  try {
    return await response.json();
  } catch {
    throw new Error('The mail server returned an invalid message list.');
  }
};

export const updateMessageStar = async (id, isStarred) => {
  const response = await fetch(`${apiBaseUrl}/messages/${encodeURIComponent(id)}/star`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ isStarred }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Could not update the starred message.');
  }
  return response.json();
};
