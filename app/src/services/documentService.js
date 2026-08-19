import { File, Paths } from 'expo-file-system';
import api from './api';
import { testapi } from './testapi';
import { ENDPOINTS } from '../constants/endpoints';
import { PAGE_SIZE } from '../constants/config';

const USE_MOCK = false;

const CHUNK_ATTEMPTS = 3;
const CHUNK_TIMEOUT = 120000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendChunk(uploadId, index, bytes) {
  let lastError;

  for (let attempt = 1; attempt <= CHUNK_ATTEMPTS; attempt += 1) {
    try {
      await api.put(ENDPOINTS.uploadChunk(uploadId, index), bytes, {
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: CHUNK_TIMEOUT,
        transformRequest: [(data) => data],
      });
      return;
    } catch (error) {
      lastError = error;

      const status = error?.status;
      if (status && status !== 408 && status < 500) throw error;

      if (attempt < CHUNK_ATTEMPTS) await wait(attempt * 1000);
    }
  }

  throw lastError;
}

export const documentService = {
  list: async (params = {}) => {
    if (USE_MOCK) return testapi.list(params);
    const { data } = await api.get(ENDPOINTS.documents, {
      params: { page: 1, limit: PAGE_SIZE, ...params },
    });
    return data;   
  },

  getById: async (id) => {
    if (USE_MOCK) return testapi.getById(id);
    return (await api.get(ENDPOINTS.documentById(id))).data;
  },

  updateMeta: async (id, meta) => {
    if (USE_MOCK) return testapi.updateMeta(id, meta);
    return (await api.put(ENDPOINTS.documentById(id), meta)).data;
  },

  remove: async (id) => {
    if (USE_MOCK) return testapi.remove(id);
    return (await api.delete(ENDPOINTS.documentById(id))).data;
  },


  upload: async (file, meta = {}, onProgress) => {
    if (USE_MOCK) return testapi.upload(file, meta, onProgress);

    const source = new File(file.uri);
    const size = file.size || source.size;

    if (!size) throw new Error('Could not read the size of that file');

    const { data: session } = await api.post(ENDPOINTS.uploadInit, {
      name: file.name,
      type: file.mimeType,
      size,
      title: meta.title || undefined,
      tags: meta.tags || undefined,
      folderId: meta.folderId || undefined,
    });

    const { uploadId, chunkSize, totalChunks } = session;
    const handle = source.open();

    try {
      for (let index = 0; index < totalChunks; index += 1) {
        handle.offset = index * chunkSize;
        const bytes = handle.readBytes(chunkSize);

        await sendChunk(uploadId, index, bytes);
        onProgress?.(Math.round(((index + 1) / totalChunks) * 100));
      }
    } catch (error) {
      handle.close();
      throw error;
    }

    handle.close();

    const { data } = await api.post(ENDPOINTS.uploadComplete(uploadId));
    return data;
  },

  resumable: {
    status: async (uploadId) => (await api.get(ENDPOINTS.uploadStatus(uploadId))).data,
    abort: async (uploadId) => (await api.delete(ENDPOINTS.uploadAbort(uploadId))).data,
  },

  stats: async () => {
    if (USE_MOCK) return testapi.stats();
    return (await api.get(`${ENDPOINTS.documents}/stats`)).data;
  },

  versions: async (id) => {
    if (USE_MOCK) return testapi.versions(id);
    return (await api.get(`${ENDPOINTS.documentById(id)}/versions`)).data;
  },

  setStatus: async (id, status) => {
    if (USE_MOCK) return testapi.setStatus(id, status);
    const url = status === 'approved' ? ENDPOINTS.approve(id) : ENDPOINTS.reject(id);
    return (await api.post(url)).data;
  },

  move: async (id, folderId) => {
    if (USE_MOCK) return testapi.folders.move(id, folderId);
    return (await api.post(ENDPOINTS.moveDocument(id), { folderId })).data;
  },


  previewUrl: async (id) => {
    const { data } = await api.get(ENDPOINTS.download(id));
    return data.url;
  },

  openUrl: async (id) => {
    const { data } = await api.get(ENDPOINTS.download(id) + '?inline=1');
    return data.url;
  },

  download: async (doc) => {
    const target = new File(Paths.cache, doc.name);

    if (USE_MOCK) {

      if (target.exists) target.delete();
      target.create();
      target.write(
        [
          `Document : ${doc.name}`,
          `Owner    : ${doc.ownerName}`,
          `Status   : ${doc.status}`,
          `Version  : v${doc.version}`,
          `Uploaded : ${doc.createdAt}`,
          '',
          '(Mock download - the real file arrives once USE_MOCK is false.)',
        ].join('\n')
      );
      return target.uri;
    }

    const { data } = await api.get(ENDPOINTS.download(doc.id));

    if (target.exists) target.delete();

    const saved = await File.downloadFileAsync(data.url, Paths.cache);
    return saved.uri;
  },
};