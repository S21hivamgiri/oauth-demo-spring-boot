// ====== These info are from Auth0 dashboard ======
import {
  AUTH0_DOMAIN,
  CLIENT_ID,
  API_AUDIENCE,
  REDIRECT_URI,
  API_BASE,
} from "./secret.js";

const logEl = document.getElementById("log");
function log(msg, obj) {
  logEl.textContent = msg + (obj ? "\n\n" + JSON.stringify(obj, null, 3) : "");
}
// ---- PKCE helpers ----
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateRandomString(length = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

async function login() {
  const codeVerifier = generateRandomString();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);
  // Stash verifier + state locally - we need the verifier again after redirect
  sessionStorage.setItem("pkce_state", state);

  // Stash verifier + state locally - we need the verifier again after redirect
  sessionStorage.setItem("pkce_code_verifier", codeVerifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    audience: API_AUDIENCE,
    //code_challenge - A hash of that secret Sent to Auth0 upfront, in the very first redirect
    //Auth0 can later verify — without ever trusting the network in between — that the app finishing the login is the same one that started it.
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    // Need to save state so check it on recieving to know CSRF attack
    state: state,
    // prompt: "login", For forced
  });

  window.location.href = `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
}

async function callApi(path) {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    log("No access token - log in first.");
    return;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  log(`${path} -> HTTP ${res.status}`, parsed);
}


async function handleRedirectCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const returnedState = urlParams.get("state");
  if (!code) return; // not a callback, nothing to do

  const expectedState = sessionStorage.getItem("pkce_state");
  if (returnedState !== expectedState) {
    log("State mismatch - possible CSRF attack. Aborting.");
    return;
  }

  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code_verifier: codeVerifier, // <-- proves WE started this flow (PKCE's whole point)
    code: code,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const tokens = await res.json();

  if (tokens.access_token) {
    sessionStorage.setItem("access_token", tokens.access_token);
    sessionStorage.setItem("id_token", tokens.id_token || "");
    log("Logged in! Tokens received:", tokens.access_token.slice(0, 40), "...");
  } else {
    log("Token exchange failed:", tokens);
  }

  // Clean the ?code=...&state=... out of the URL bar
  window.history.replaceState({}, document.title, window.location.pathname);
}

function logout() {
  sessionStorage.clear();
  log("Logged out (local tokens cleared).");
}

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document
  .getElementById("serverHealth")
  .addEventListener("click", () => callApi("/api/health"));
document
  .getElementById("callMeBtn")
  .addEventListener("click", () => callApi("/api/me"));
document
  .getElementById("callAdminBtn")
  .addEventListener("click", () => callApi("/api/admin/dashboard"));
handleRedirectCallback();
