const { createWorker } = require('tesseract.js');
const { PDFParse } = require('pdf-parse');

const logger = require('../utils/logger');
const storage = require('./storageService');
const docRepo = require('../repositories/documentRepository');
const notificationRepo = require('../repositories/notificationRepository');

const IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MIN_PDF_TEXT_CHARS = 24;
const MIN_OCR_CONFIDENCE = 60;
const MIN_OCR_WORDS = 4;
const JOB_TIMEOUT_MS = 3 * 60 * 1000;
const PAGE_MARKER = /^--\s*\d+\s+of\s+\d+\s*--$/gm;

let workerPromise = null;
const queue = [];
let draining = false;

async function getWorker() {
  if (!workerPromise) workerPromise = createWorker('eng');
  return workerPromise;
}

async function readPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const { text } = await parser.getText();
    return text.replace(PAGE_MARKER, '').replace(/\n{3,}/g, '\n\n').trim();
  } finally {
    await parser.destroy();
  }
}

function countWords(text) {
  return (text.match(/[A-Za-z0-9]{2,}/g) || []).length;
}

function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label + " exceeded " + ms + "ms")), ms);
  });

  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

async function readImageText(buffer) {
  const worker = await getWorker();
  const { data } = await worker.recognize(buffer);

  return { text: data.text.trim(), confidence: data.confidence };
}

async function extract(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const text = await readPdfText(buffer);

    if (text.length >= MIN_PDF_TEXT_CHARS) {
      return { text, confidence: null, source: 'pdf-text-layer' };
    }

    return { text: '', confidence: null, source: 'pdf-no-text-layer' };
  }

  if (IMAGE_TYPES.includes(mimeType)) {
    const { text, confidence } = await readImageText(buffer);

    if (confidence < MIN_OCR_CONFIDENCE || countWords(text) < MIN_OCR_WORDS) {
      return { text: '', confidence, source: 'ocr-below-threshold' };
    }

    return { text, confidence, source: 'tesseract' };
  }

  return { text: '', confidence: null, source: 'unsupported-type' };
}

async function runJob({ documentId, userId, name, storageKey, mimeType }) {
  const started = Date.now();

  try {
    const buffer = await storage.getObjectBuffer(storageKey);
    const { text, confidence, source } = await withTimeout(
      extract(buffer, mimeType),
      JOB_TIMEOUT_MS,
      'ocr for "' + name + '"'
    );

    await docRepo.saveExtractedText(documentId, {
      content: text || null,
      ocrConfidence: confidence,
    });

    logger.info(
      `ocr ${source} for "${name}": ${text.length} chars in ${Date.now() - started}ms`
    );

    await notificationRepo.create({
      userId,
      title: text ? 'Text extraction finished' : 'No text found',
      body: text
        ? `${name} is now searchable by its contents.`
        : `${name} was processed but no readable text was found.`,
      type: 'ocr',
    });
  } catch (err) {
    logger.error(`ocr failed for "${name}": ${err.message}`);

    await docRepo
      .saveExtractedText(documentId, { content: null, ocrConfidence: null })
      .catch(() => {});
  }
}

async function drain() {
  if (draining) return;
  draining = true;

  try {
    while (queue.length) {
      await runJob(queue.shift());
    }
  } finally {
    draining = false;
  }
}

async function recoverStuck() {
  const rows = await docRepo.findProcessing();
  if (!rows.length) return 0;

  rows.forEach((row) =>
    enqueue({
      documentId: row.id,
      userId: row.userId,
      name: row.name,
      storageKey: row.storageKey,
      mimeType: row.type,
    })
  );

  logger.info("ocr requeued " + rows.length + " document(s) left in processing");
  return rows.length;
}

function enqueue(job) {
  queue.push(job);
  setImmediate(() => drain().catch((err) => logger.error(`ocr queue crashed: ${err.message}`)));
}

async function shutdown() {
  if (!workerPromise) return;

  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
}

module.exports = { enqueue, extract, shutdown, recoverStuck };
