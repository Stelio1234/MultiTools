import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { files, root } from './site.mjs';
import './check.mjs';

const destination = resolve(root, 'dist');
if (destination !== join(root, 'dist')) throw new Error('Invalid output directory.');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const publicRootFiles = new Set(['manifest.json', 'owner.json', 'robots.txt', 'sitemap.xml', 'LICENSE.txt']);
const sourceFiles = (await files()).filter(path => /^(css|images|js|vendor|Templates|Tools)\//.test(path) || /^[^/]+\.html$/.test(path) || publicRootFiles.has(path));
const publishedSources = sourceFiles.filter(path => !path.endsWith('.htaccess') && path !== 'Templates/Other/sitemap.xml');
for (const path of publishedSources) {
  await mkdir(dirname(join(destination, path)), { recursive: true });
  await cp(join(root, path), join(destination, path));
}
await cp(join(root, 'CNAME'), join(destination, 'CNAME'));
await writeFile(join(destination, '.nojekyll'), '');
const privateFiles = ['admin.html', 'login.html', 'settings.html'];
for (const path of privateFiles) {
  if (!(await readFile(join(destination, path), 'utf8')).includes('noindex')) throw new Error(`Missing noindex: ${path}`);
}
console.log(`Built ${publishedSources.length + 2} static files into dist; deployment credentials and development files excluded.`);
