import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Architecture and Security Regression Tests', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'public', 'manifest.json');
  const swPath = path.join(rootDir, 'public', 'sw.js');

  describe('Manifest Specification & Multilingual Support', () => {
    it('manifest.json exists and is valid JSON', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('contains standard PWA metadata with standalone display and proper scope', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.id).toBe('/grievance');
      expect(manifest.start_url).toBe('/en/grievance');
      expect(manifest.scope).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#059669');
      expect(manifest.background_color).toBe('#0f172a');
    });

    it('references existing icon files with correct dimensions and purposes', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

      for (const icon of manifest.icons) {
        const iconDiskPath = path.join(rootDir, 'public', icon.src.replace(/^\//, ''));
        expect(fs.existsSync(iconDiskPath)).toBe(true);
        expect(['any', 'maskable']).toContain(icon.purpose);
      }
    });

    it('provides multilingual shortcuts for English, Marathi, and Hindi', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      const urls = manifest.shortcuts.map((s: { url: string }) => s.url);
      expect(urls).toContain('/en/grievance');
      expect(urls).toContain('/mr/grievance');
      expect(urls).toContain('/hi/grievance');
    });
  });

  describe('Service Worker Security & Namespace Isolation', () => {
    it('sw.js exists and defines an isolated cache namespace', () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swCode = fs.readFileSync(swPath, 'utf-8');

      expect(swCode).toContain("const CACHE_PREFIX = 'amc-grievance-';");
      // Cache pruning must only target its own namespace
      expect(swCode).toContain('key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME');
      // Must NOT purge foreign caches from the domain
      expect(swCode).not.toMatch(/keys\.filter\(\s*\(key\)\s*=>\s*key\s*!==\s*CACHE_NAME\s*\)/);
    });

    it('prevents caching of authenticated pages and honors anti-cache headers', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');

      // Verifies public route whitelist check exists
      expect(swCode).toContain('isPublicGrievanceRoute');
      expect(swCode).toContain('PUBLIC_PORTAL_PATTERN');

      // Ensures admin / back-office routes are never cached
      expect(swCode).toContain("if (url.pathname.includes('/admin')) return false;");

      // Verifies no-store and private header checks
      expect(swCode).toContain("cacheControl.includes('no-store')");
      expect(swCode).toContain("cacheControl.includes('private')");

      // Verifies authenticated offline request returns safe message instead of cached response
      expect(swCode).toContain('This authenticated page requires an active internet connection');
    });

    it('coordinates asynchronous cache writes using event.waitUntil', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');
      expect(swCode).toContain('event.waitUntil(');
      expect(swCode).toContain('caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))');
    });
  });

  describe('Elimination of Duplicate Definitions', () => {
    it('no duplicate route handlers exist in src/app for sw.js or manifest', () => {
      expect(fs.existsSync(path.join(rootDir, 'src', 'app', 'sw.js'))).toBe(false);
      expect(fs.existsSync(path.join(rootDir, 'src', 'app', 'manifest.json'))).toBe(false);
      expect(fs.existsSync(path.join(rootDir, 'src', 'app', 'manifest.webmanifest'))).toBe(false);
    });
  });
});
