const crypto = require('crypto');

const config = require('../src/config/env');
const storage = require('../src/services/storageService');
const { sequelize } = require('../src/models');

let failures = 0;

function pass(label, detail) {
  console.log(`  PASS  ${label}${detail ? '  ' + detail : ''}`);
}

function fail(label, detail) {
  failures += 1;
  console.log(`  FAIL  ${label}${detail ? '  ' + detail : ''}`);
}

async function checkStorageReachable() {
  console.log('\n[1] object storage reachable and authenticated');
  try {
    await storage.ensureBucket();
    pass('bucket available', `"${config.s3.bucket}" at ${config.s3.endpoint || 'aws'}`);
  } catch (err) {
    fail('bucket unavailable', `${err.name}: ${err.message}`);
  }
}

async function checkRoundTrip() {
  console.log('\n[2] write -> presign -> read -> delete round trip');

  const key = `__verify__/${crypto.randomUUID()}.txt`;
  const payload = Buffer.from(`verify ${new Date().toISOString()}`);

  try {
    await storage.putObject(key, payload, 'text/plain');
    pass('wrote object', `${payload.length} bytes`);

    const size = await storage.objectSize(key);
    if (size === payload.length) pass('size matches', `${size} bytes`);
    else fail('size mismatch', `expected ${payload.length}, got ${size}`);

    const url = await storage.getDownloadUrl(key, 'verify.txt');
    const host = new URL(url).origin;
    pass('presigned url issued', `host ${host}, ttl ${config.s3.urlTtlSeconds}s`);

    const res = await fetch(url);
    const body = Buffer.from(await res.arrayBuffer());

    if (res.ok && body.equals(payload)) pass('fetched via presigned url', `HTTP ${res.status}, bytes identical`);
    else fail('presigned fetch failed', `HTTP ${res.status}, ${body.length} bytes`);
  } catch (err) {
    fail('round trip errored', `${err.name}: ${err.message}`);
  } finally {
    await storage.remove(key);
  }
}

async function checkMultipart() {
  console.log('\n[3] multipart create -> upload parts -> complete');

  const key = `__verify__/${crypto.randomUUID()}.bin`;
  const partSize = 5 * 1024 * 1024;
  const partA = Buffer.alloc(partSize, 0x41);
  const partB = Buffer.alloc(1024, 0x42);

  let uploadId;

  try {
    uploadId = await storage.createMultipart(key, 'application/octet-stream');
    pass('multipart created', uploadId.slice(0, 24) + '...');

    const etagA = await storage.uploadPart({ key, uploadId, partNumber: 1, body: partA });
    const etagB = await storage.uploadPart({ key, uploadId, partNumber: 2, body: partB });
    pass('uploaded 2 parts', `${partA.length} + ${partB.length} bytes`);

    await storage.completeMultipart({
      key,
      uploadId,
      parts: [
        { PartNumber: 1, ETag: etagA },
        { PartNumber: 2, ETag: etagB },
      ],
    });
    uploadId = null;

    const size = await storage.objectSize(key);
    const expected = partA.length + partB.length;

    if (size === expected) pass('assembled correctly', `${size} bytes`);
    else fail('assembled size wrong', `expected ${expected}, got ${size}`);
  } catch (err) {
    fail('multipart errored', `${err.name}: ${err.message}`);
  } finally {
    if (uploadId) await storage.abortMultipart(key, uploadId);
    await storage.remove(key);
  }
}

async function checkReconciliation() {
  console.log('\n[4] every documents row has its bytes in storage');

  const [docs] = await sequelize.query(
    'SELECT id, name, size, storage_key FROM documents ORDER BY created_at DESC'
  );

  if (!docs.length) {
    pass('no documents to check', '(table is empty)');
    return;
  }

  let ok = 0;

  for (const doc of docs) {
    let size = null;
    try {
      size = await storage.objectSize(doc.storage_key);
    } catch {
      size = null;
    }

    if (size === null) fail('object missing', `${doc.name} -> ${doc.storage_key}`);
    else if (Number(size) !== Number(doc.size)) {
      fail('size mismatch', `${doc.name}: db ${doc.size}, storage ${size}`);
    } else ok += 1;
  }

  if (ok === docs.length) pass('all documents reconciled', `${ok}/${docs.length}`);
  else console.log(`        ${ok}/${docs.length} reconciled`);
}

async function main() {
  console.log('storage verification');
  console.log(`endpoint       : ${config.s3.endpoint || '(aws default)'}`);
  console.log(`publicEndpoint : ${config.s3.publicEndpoint || '(same)'}`);
  console.log(`bucket         : ${config.s3.bucket}`);

  await checkStorageReachable();
  await checkRoundTrip();
  await checkMultipart();
  await checkReconciliation();

  console.log(failures === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures} CHECK(S) FAILED\n`);

  await sequelize.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`verification crashed: ${err.stack}`);
  process.exit(1);
});
