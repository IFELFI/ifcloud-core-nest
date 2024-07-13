import path from 'path';

const baseDir = process.env.BASE_STORAGE_PATH || 'storage';
const originDir = path.join(baseDir, 'origin');
const videoDir = path.join(baseDir, 'video');
const chunkDir = path.join(baseDir, 'chunk');

if (!baseDir) {
  throw new Error('STORAGE_PATH is not defined');
}

export const storagePath = {
  baseDir,
  originDir,
  videoDir,
  chunkDir,
};
