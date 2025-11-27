// background.js
// OAuth helper for Google Calendar usage from the extension.
// Replace CLIENT_ID with your actual OAuth Client ID (Chrome-extension OAuth client).

const CLIENT_ID = "21335236644-rvl386jp092ve26bmf8o0g48kvegntba.apps.googleusercontent.com"; // <-- put your client id here
const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "profile",
  "email"
];

// Build the OAuth URL for the extension (implicit flow, token in fragment)
function getAuthUrl() {
  const redirectUri = chrome.identity.getRedirectURL();
  const scope = encodeURIComponent(OAUTH_SCOPES.join(" "));
  return (
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    "&response_type=token" +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    "&prompt=consent" +
    "&include_granted_scopes=true"
  );
}

// Perform interactive sign-in and extract access_token from redirect URL
function interactiveSignIn() {
  return new Promise((resolve, reject) => {
    const authUrl = getAuthUrl();
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (!redirectUrl) return reject(new Error("No redirect URL returned"));

      try {
        // redirectUrl contains the token in the fragment (#access_token=...)
        const u = new URL(redirectUrl);
        const hash = u.hash.substring(1); // remove '#'
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const expiresIn = params.get("expires_in");
        const tokenType = params.get("token_type");

        if (!accessToken) return reject(new Error("No access token found in redirect URL"));

        resolve({ accessToken, expiresIn: Number(expiresIn || 0), tokenType });
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Listener: popup will send { type: 'GET_GOOGLE_TOKEN' } to request an interactive token
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "GET_GOOGLE_TOKEN") return; // ignore other messages

  interactiveSignIn()
    .then(tokenData => {
      sendResponse({ success: true, tokenData });
    })
    .catch(err => {
      sendResponse({ success: false, error: err.message || String(err) });
    });

  // Will respond asynchronously
  return true;
});

// Optional: log install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("SNU TimeSync background service worker installed/updated:", details);
});
