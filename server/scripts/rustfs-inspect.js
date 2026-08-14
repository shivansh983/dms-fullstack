const {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  ListMultipartUploadsCommand,
} = require('@aws-sdk/client-s3');

const config = require('../src/config/env');

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  forcePathStyle: Boolean(config.s3.endpoint),
  credentials:
    config.s3.accessKey && config.s3.secretKey
      ? { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey }
      : undefined,
});

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

async function main() {
  console.log(`endpoint : ${config.s3.endpoint || '(aws default)'}`);
  console.log(`bucket   : ${config.s3.bucket}\n`);

  const { Buckets } = await s3.send(new ListBucketsCommand({}));
  console.log(`buckets  : ${(Buckets || []).map((b) => b.Name).join(', ') || '(none)'}\n`);

  const objects = await s3.send(
    new ListObjectsV2Command({ Bucket: config.s3.bucket })
  );

  const contents = objects.Contents || [];
  const total = contents.reduce((sum, o) => sum + o.Size, 0);

  console.log(`objects  : ${contents.length}  (${mb(total)} total)`);

  for (const o of contents) {
    console.log(`  ${o.LastModified.toISOString()}  ${mb(o.Size).padStart(10)}  ${o.Key}`);
  }

  const multipart = await s3.send(
    new ListMultipartUploadsCommand({ Bucket: config.s3.bucket })
  );

  const pending = multipart.Uploads || [];

  console.log(`\nin-flight multipart uploads : ${pending.length}`);

  for (const u of pending) {
    console.log(`  ${u.Initiated.toISOString()}  ${u.Key}  (${u.UploadId.slice(0, 24)}...)`);
  }

  if (pending.length) {
    console.log('\nthese are unfinished uploads. abandoned ones are reaped by the');
    console.log('upload GC, but on real AWS they bill until aborted.');
  }
}

main().catch((err) => {
  console.error(`FAILED: ${err.name} - ${err.message}`);
  process.exit(1);
});
