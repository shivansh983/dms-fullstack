const config = require('../../config/env');

async function recognize(buffer, mimeType, filename = 'document') {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), filename);

  const response = await fetch(`${config.ocr.paddleUrl}/ocr`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(config.ocr.paddleTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`paddle returned ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();

  const pages = (body.pages || []).map((page) => ({
    page: page.page,
    text: (page.text || '').trim(),
    confidence: page.confidence ?? null,
  }));

  return {
    engine: 'paddleocr',
    text: (body.text || '').trim(),
    confidence: body.confidence ?? null,
    pages,
  };
}

async function isReachable() {
  try {
    const response = await fetch(`${config.ocr.paddleUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = { recognize, isReachable };
