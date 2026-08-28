const config = require('../config/env');
const logger = require('../utils/logger');
const storage = require('./storageService');
const docRepo = require('../repositories/documentRepository');
const notificationRepo = require('../repositories/notificationRepository');
const { extract, resetTesseract, shutdown } = require('./ocr');

const queue = [];
let draining = false;

function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label + ' exceeded ' + ms + 'ms')), ms);
  });

  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

async function runJob({ documentId, userId, name, storageKey, mimeType }) {
  const started = Date.now();

  try {
    const buffer = await storage.getObjectBuffer(storageKey);

    const result = await withTimeout(
      extract(buffer, mimeType, name),
      config.ocr.jobTimeoutMs,
      'ocr for "' + name + '"'
    );

    await docRepo.saveExtractedText(documentId, {
      content: result.text || null,
      ocrConfidence: result.confidence,
      pages: result.pages,
      engine: result.engine,
    });

    logger.info(
      `ocr ${result.engine} for "${name}": ${result.text.length} chars, ` +
        `${result.pages.length} page(s) in ${Date.now() - started}ms`
    );

    await notificationRepo.create({
      userId,
      title: result.text ? 'Text extraction finished' : 'No text found',
      body: result.text
        ? `${name} is now readable in the app and searchable by its contents.`
        : `${name} was processed but no readable text was found.`,
      type: 'ocr',
    });
  } catch (err) {
    logger.error(`ocr failed for "${name}": ${err.message}`);

    if (err.message.includes('exceeded')) await resetTesseract();

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

  logger.info('ocr requeued ' + rows.length + ' document(s) left in processing');
  return rows.length;
}

function enqueue(job) {
  queue.push(job);
  setImmediate(() => drain().catch((err) => logger.error(`ocr queue crashed: ${err.message}`)));
}

module.exports = { enqueue, extract, shutdown, recoverStuck };
