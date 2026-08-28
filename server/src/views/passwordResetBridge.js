const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

function render({ deepLink, minutes, nonce }) {
  const safeLink = escapeHtml(deepLink);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Reset your password</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f8fafc; color: #0f172a; padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 32px; max-width: 380px; width: 100%; text-align: center;
    box-shadow: 0 8px 24px -12px rgba(15,23,42,.2);
  }
  h1 { font-size: 20px; margin: 0 0 8px; }
  p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
  a.button {
    display: block; background: #2563eb; color: #fff; text-decoration: none;
    padding: 14px 20px; border-radius: 10px; font-weight: 600; font-size: 15px;
  }
  .hint { font-size: 13px; color: #94a3b8; margin: 16px 0 0; }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #f1f5f9; }
    .card { background: #1e293b; border-color: #334155; }
    p { color: #94a3b8; }
  }
</style>
</head>
<body>
  <div class="card">
    <h1>Opening Document Manager</h1>
    <p>We are handing you over to the app to finish resetting your password.</p>
    <a class="button" href="${safeLink}">Open the app</a>
    <p class="hint">This link works once and expires ${minutes} minutes after it was sent.</p>
  </div>
  <script nonce="${escapeHtml(nonce)}">window.location.replace(${JSON.stringify(deepLink)});</script>
</body>
</html>`;
}

function renderInvalid() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Reset link problem</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f8fafc; color: #0f172a; padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 32px; max-width: 380px; width: 100%; text-align: center;
  }
  h1 { font-size: 20px; margin: 0 0 8px; }
  p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0; }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #f1f5f9; }
    .card { background: #1e293b; border-color: #334155; }
    p { color: #94a3b8; }
  }
</style>
</head>
<body>
  <div class="card">
    <h1>This link is not valid</h1>
    <p>Open the app and request a new password reset email.</p>
  </div>
</body>
</html>`;
}

module.exports = { render, renderInvalid };
