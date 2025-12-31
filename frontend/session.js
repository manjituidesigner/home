let sessionToken = null;
let sessionUser = null;

export function setSessionToken(token) {
  sessionToken = token ? String(token) : null;
}

export function getSessionToken() {
  return sessionToken;
}

export function setSessionUser(user) {
  sessionUser = user || null;
}

export function getSessionUser() {
  return sessionUser;
}

export function clearSession() {
  sessionToken = null;
  sessionUser = null;
}
