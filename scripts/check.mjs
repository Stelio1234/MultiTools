import { readFile, access } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { HtmlValidate } from 'html-validate';
import { files, root, html, elements, attr, textContent, origin } from './site.mjs';

const paths = await files();
const pages = paths.filter(path => path.endsWith('.html'));
const problems = [];
const titles = new Set(), descriptions = new Set(), publicUrls = [];
const validator = new HtmlValidate({ extends: ['html-validate:standard'], rules: { 'void-style': 'off', 'no-trailing-whitespace': 'off', 'no-inline-style': 'off', 'heading-level': 'off', 'prefer-native-element': 'off', 'wcag/h32': 'off', 'no-implicit-input-type': 'off', 'input-missing-label': 'off', 'svg-focusable': 'off', 'attr-quotes': 'off', 'long-title': 'off', 'no-dup-class': 'off', 'tel-non-breaking': 'off', 'no-implicit-button-type': 'off', 'require-sri': 'off' } });
for (const path of pages) {
  const source = await readFile(join(root, path), 'utf8');
  const nodes = elements(await html(path));
  const ids = nodes.map(node => attr(node, 'id')).filter(Boolean);
  if (ids.length !== new Set(ids).size) problems.push(`${path}: duplicate IDs`);
  const title = textContent(nodes.find(node => node.tagName === 'title') || {});
  const description = attr(nodes.find(node => node.tagName === 'meta' && attr(node, 'name') === 'description') || {}, 'content');
  const canonical = attr(nodes.find(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical') || {}, 'href');
  if (!title || titles.has(title)) problems.push(`${path}: missing/duplicate title`); titles.add(title);
  if (!description || descriptions.has(description)) problems.push(`${path}: missing/duplicate description`); descriptions.add(description);
  if (!canonical?.startsWith(origin + '/')) problems.push(`${path}: canonical origin`);
  if (!nodes.some(node => attr(node, 'name') === 'viewport')) problems.push(`${path}: viewport missing`);
  if (!nodes.some(node => attr(node, 'rel') === 'icon')) problems.push(`${path}: favicon missing`);
  const noindex = nodes.some(node => attr(node, 'name') === 'robots' && attr(node, 'content')?.includes('noindex'));
  if (!noindex && canonical) publicUrls.push(canonical);
  for (const node of nodes) {
    if (node.attrs?.some(attr => /^on/i.test(attr.name))) problems.push(`${path}: inline event handler`);
    if (node.tagName === 'script' && !attr(node, 'src') && !['application/ld+json', 'application/json'].includes(attr(node, 'type'))) problems.push(`${path}: inline script`);
    if (node.tagName === 'img' && attr(node, 'alt') === undefined) problems.push(`${path}: image alt missing`);
    for (const name of ['src', 'href']) {
      const value = attr(node, name);
      if (!value || /^(https:|mailto:|data:|blob:)/.test(value)) continue;
      if (value.startsWith('#')) {
        if (value.length > 1 && !ids.includes(decodeURIComponent(value.slice(1)))) problems.push(`${path}: missing fragment ${value}`);
        continue;
      }
      if (/^(http:|javascript:|\/\/)/i.test(value)) { problems.push(`${path}: unsafe resource ${value}`); continue; }
      const target = decodeURIComponent(value.split(/[?#]/)[0]);
      const local = target.startsWith('/') ? target.slice(1) : posix.join(posix.dirname(path), target);
      try {
        await access(join(root, local || 'index.html'));
        const fragment = value.split('#')[1];
        if (fragment && local.endsWith('.html') && !elements(await html(local)).some(node => attr(node, 'id') === decodeURIComponent(fragment))) problems.push(`${path}: missing fragment in ${value}`);
      }
      catch { problems.push(`${path}: missing ${local}`); }
    }
  }
  const report = await validator.validateString(source, path);
  for (const result of report.results) for (const message of result.messages) problems.push(`${path}:${message.line} ${message.ruleId}: ${message.message}`);
}
for (const path of paths.filter(path => path.endsWith('.js') && !path.startsWith('vendor/'))) {
  try { execFileSync(process.execPath, ['--check', join(root, path)], { stdio: 'pipe' }); }
  catch (error) { problems.push(`${path}: ${error.stderr}`); }
}
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (new Set(locations).size !== locations.length || locations.length !== publicUrls.length || publicUrls.some(url => !locations.includes(url))) problems.push('Sitemap differs from public canonical pages.');
if (/<lastmod>/.test(sitemap)) problems.push('Unverified sitemap modification date.');
if (!(await readFile(join(root, 'robots.txt'), 'utf8')).includes(`Sitemap: ${origin}/sitemap.xml`)) problems.push('robots.txt sitemap missing.');
const owner = JSON.parse(await readFile(join(root, 'owner.json'))).uid;
if (!(await readFile(join(root, 'firestore.rules'), 'utf8')).includes(`request.auth.uid == '${owner}'`)) problems.push('Owner UID does not match backend rules.');
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; throw new Error(`${problems.length} source checks failed.`); }
console.log(`Checked ${pages.length} HTML pages, local resource links, HTML structure, metadata, owner configuration, JavaScript syntax, and ${locations.length} sitemap entries.`);
