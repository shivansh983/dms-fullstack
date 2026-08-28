const { PDFParse } = require('pdf-parse');

const config = require('../../config/env');
const logger = require('../../utils/logger');
const tesseract = require('./tesseractEngine');
const paddle = require('./paddleEngine');

const IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MIN_PDF_TEXT_CHARS = 24;
const PAGE_MARKER = /^--\s*\d+\s+of\s+\d+\s*--$/gm;
const BLANK_RUN = /\n{3,}/g;

const countWords = (text) => (text.match(/[A-Za-z0-9]{2,}/g) || []).length;

const tidy = (text) => String(text ?? '').replace(BLANK_RUN, '\n\n').trim();

function isGoodEnough({ text, confidence }) {
  if (countWords(text) < config.ocr.minWords) return false;

  return confidence == null || confidence >= config.ocr.minConfidence;
}

function empty(engine) {
  return { engine, text: '', confidence: null, pages: [] };
}

async function readPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    const text = tidy(result.text.replace(PAGE_MARKER, ''));

    const pages = (result.pages || [])
      .map((page) => ({ page: page.num, text: tidy(page.text), confidence: null }))
      .filter((page) => page.text);

    return { text, pages };
  } finally {
    await parser.destroy();
  }
}

async function tryPaddle(buffer, mimeType, name) {
  if (!config.ocr.paddleEnabled) return null;

  try {
    return await paddle.recognize(buffer, mimeType, name);
  } catch (err) {
    logger.error(`paddle unavailable for "${name}", keeping what we have: ${err.message}`);
    return null;
  }
}

async function extract(buffer, mimeType, name = 'document') {
  if (mimeType === 'application/pdf') {
    const { text, pages } = await readPdfText(buffer);

    if (text.length >= MIN_PDF_TEXT_CHARS) {
      return {
        engine: 'pdf-text-layer',
        text,
        confidence: null,
        pages: pages.length ? pages : [{ page: 1, text, confidence: null }],
      };
    }

    const scanned = await tryPaddle(buffer, mimeType, name);

    if (scanned) {
      logger.info(`ocr read scanned pdf "${name}" with paddle`);
      return scanned;
    }

    return empty('pdf-no-text-layer');
  }

  if (!IMAGE_TYPES.includes(mimeType)) return empty('unsupported-type');

  const first = await tesseract.recognize(buffer);

  if (isGoodEnough(first)) return first;

  logger.info(
    `ocr escalating "${name}" to paddle ` +
      `(tesseract confidence ${first.confidence}, ${countWords(first.text)} words)`
  );

  const second = await tryPaddle(buffer, mimeType, name);
  if (!second) return first;

  if (isGoodEnough(second)) return second;

  return (second.confidence ?? 0) > (first.confidence ?? 0) ? second : first;
}

module.exports = {
  extract,
  isGoodEnough,
  resetTesseract: tesseract.reset,
  shutdown: tesseract.shutdown,
  paddleReachable: paddle.isReachable,
};
