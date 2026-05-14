import sharpService from 'astro/assets/services/sharp';
import type { LocalImageService } from 'astro';
import sharp from 'sharp';
import { spawn } from 'node:child_process';

const qualityTable: Record<string, number> = {
  low: 50,
  mid: 70,
  high: 80,
  max: 95,
};

const fitMap = {
  fill: 'fill',
  contain: 'inside',
  cover: 'cover',
  none: 'outside',
  'scale-down': 'inside',
  outside: 'outside',
  inside: 'inside',
} as const;

const CJXL = process.env.CJXL ?? 'cjxl';

function resolveQuality(quality: unknown): number {
  if (quality === undefined || quality === null) return qualityTable.high;
  if (typeof quality === 'number') return quality;
  const str = String(quality);
  const parsed = parseInt(str);
  if (!Number.isNaN(parsed)) return parsed;
  if (str in qualityTable) return qualityTable[str];
  return qualityTable.high;
}

function runCjxl(pngBuffer: Buffer, quality: number, effort = 7): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const proc = spawn(CJXL, ['-', '-', '-q', String(quality), '-e', String(effort)], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const chunks: Buffer[] = [];
    let stderr = '';
    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(new Uint8Array(Buffer.concat(chunks)));
      else reject(new Error(`cjxl exited with code ${code}: ${stderr.trim()}`));
    });
    proc.stdin.end(pngBuffer);
  });
}

async function encodeJxl(
  inputBuffer: Uint8Array,
  transform: { width?: number; height?: number; fit?: keyof typeof fitMap; position?: string; quality?: number | string },
): Promise<{ data: Uint8Array; format: 'jxl' }> {
  const pipeline = sharp(inputBuffer, { failOnError: false, pages: -1 }).rotate();

  const withoutEnlargement = Boolean(transform.fit);
  if (transform.width && transform.height && transform.fit) {
    pipeline.resize({
      width: Math.round(transform.width),
      height: Math.round(transform.height),
      fit: fitMap[transform.fit] ?? 'inside',
      position: transform.position,
      withoutEnlargement,
    });
  } else if (transform.height && !transform.width) {
    pipeline.resize({ height: Math.round(transform.height), withoutEnlargement });
  } else if (transform.width) {
    pipeline.resize({ width: Math.round(transform.width), withoutEnlargement });
  }

  const pngBuffer = await pipeline.png({ compressionLevel: 0 }).toBuffer();
  const data = await runCjxl(pngBuffer, resolveQuality(transform.quality));
  return { data, format: 'jxl' };
}

const service: LocalImageService = {
  ...sharpService,
  async transform(inputBuffer, transformOptions, config) {
    if (transformOptions.format === 'jxl') {
      return encodeJxl(inputBuffer, transformOptions as Parameters<typeof encodeJxl>[1]);
    }
    return sharpService.transform!(inputBuffer, transformOptions, config);
  },
};

export default service;
