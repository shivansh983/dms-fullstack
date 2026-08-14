import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { formatSize } from './formatters';

export const MAX_SIZE = 2 * 1024 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

export function fromDocumentPicker(asset) {
  return {
    uri: asset.uri,
    name: asset.name,
    size: asset.size,
    mimeType: asset.mimeType || 'application/pdf',
  };
}

export function fromImageAsset(asset) {
  return {
    uri: asset.uri,
    name: asset.fileName || `scan_${Date.now()}.jpg`,
    size: asset.fileSize,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}

export async function compressImage(file, { maxWidth = 1600, quality = 0.7 } = {}) {
  if (!file.mimeType?.startsWith('image')) return file;    

  const result = await ImageManipulator.manipulateAsync(
    file.uri,
    [{ resize: { width: maxWidth } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  return { ...file, uri: result.uri, size: new File(result.uri).size, mimeType: 'image/jpeg' };
}

export function validateFile(file) {
  if (!file) return 'No file selected';
  if (file.size && file.size > MAX_SIZE) return `File is larger than ${formatSize(MAX_SIZE)}`;
  if (file.mimeType && !ALLOWED.includes(file.mimeType)) return 'Only PDF, JPG and PNG are allowed';
  return null;
}