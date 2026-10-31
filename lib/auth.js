'use client';

/**
 * Signed-in session for the school web app: the API token and the user profile.
 * Only school admins (role "admin") use this app.
 */

const TOKEN_KEY = 'edupulse_token';
const USER_KEY = 'edupulse_user';

const isBrowser = () => typeof window !== 'undefined';

export function getToken() {
  return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
}

export function getUser() {
  if (!isBrowser()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
}

export function clearAuth() {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/** True when the stored session belongs to a school admin. */
export function isSchoolAdmin() {
  return isAuthenticated() && getUser()?.role === 'admin';
}
