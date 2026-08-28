const { createWorker } = require('tesseract.js');

const logger = require('../../utils/logger');

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) workerPromise = createWorker('eng');
  return workerPromise;
}

async function reset() {
  if (!workerPromise) return;

  const worker = await workerPromise.catch(() => null);
  workerPromise = null;

  if (worker) await worker.terminate().catch(() => {});
  logger.warn('tesseract worker reset');
}

async function recognize(buffer) {
  const worker = await getWorker();
  const { data } = await worker.recognize(buffer);

  const text = data.text.trim();

  return {
    engine: 'tesseract',
    text,
    confidence: data.confidence,
    pages: [{ page: 1, text, confidence: data.confidence }],
  };
}

module.exports = { recognize, reset, shutdown: reset };
