import type { Plugin } from 'vite';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const heicRegex = /\.(heic|heif)$/i;

export function heicImportPlugin(): Plugin {
  const cacheDir = path.join('node_modules', '.cache', 'heic-import');

  return {
    name: 'astro:heic-import',
    enforce: 'pre',

    resolveId: {
      filter: { id: heicRegex },
      async handler(source, importer) {
        const resolved = await this.resolve(source, importer, { skipSelf: true });
        if (!resolved) return;
        const cleanId = resolved.id.split('?')[0];
        if (!heicRegex.test(cleanId)) return;

        fs.mkdirSync(cacheDir, { recursive: true });

        const srcBuf = fs.readFileSync(cleanId);
        const hash = createHash('sha256').update(srcBuf).digest('hex').slice(0, 12);
        const basename = path.basename(cleanId, path.extname(cleanId));
        const pngPath = path.join(cacheDir, `${basename}.${hash}.png`);

        if (!fs.existsSync(pngPath)) {
          const pngBuf = await sharp(srcBuf).png({ compressionLevel: 1 }).toBuffer();
          fs.writeFileSync(pngPath, pngBuf);
        }

        return path.resolve(pngPath);
      },
    },
  };
}
