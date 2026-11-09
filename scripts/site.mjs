import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { parse } from 'parse5';

export const root = resolve(import.meta.dirname, '..');
export async function files(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (['.git', 'node_modules', 'dist', '.firebase', 'test-results', 'private-data'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await files(path));
    else output.push(relative(root, path).replaceAll('\\', '/'));
  }
  return output.sort();
}
export function elements(node) {
  return [node, ...(node.childNodes || []).flatMap(elements)].filter(node => node.tagName);
}
export const attr = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
export const textContent = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(textContent).join('');
export async function html(path) { return parse(await readFile(join(root, path), 'utf8')); }
export const origin = 'https://www.themultitools.xyz';
export const csp = "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com https://multitools.statuspage.io https://naas.isalman.dev; frame-src https://multitools-48cc8.firebaseapp.com https://accounts.google.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";
export const headers = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'X-Frame-Options', value: 'DENY' }
];
