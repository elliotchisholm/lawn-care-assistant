import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const publicDir = resolve(__dirname, '../../public');
const manifest = JSON.parse(readFileSync(resolve(publicDir, 'manifest.webmanifest'), 'utf8'));
const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

function pngSize(file: string) {
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('PWA manifest', () => {
  it('has the fields needed for install', () => {
    expect(manifest.name).toBe('NZLA Lawn Care Assistant');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  it('lists icons that exist with the declared sizes', () => {
    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((i: any) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      const file = resolve(publicDir, icon.src.replace(/^\//, ''));
      expect(existsSync(file), icon.src).toBe(true);
      const [w, h] = icon.sizes.split('x').map(Number);
      expect(pngSize(file)).toEqual({ width: w, height: h });
    }
  });

  it('has a 180px apple touch icon', () => {
    expect(pngSize(resolve(publicDir, 'apple-touch-icon.png'))).toEqual({ width: 180, height: 180 });
  });

  it('is linked from index.html without inline scripts (CSP)', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
  });
});
