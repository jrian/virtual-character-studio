import { mkdir, cp, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/data', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'engine.js', 'favicon.svg', 'library-binding.js']) await cp(file, `dist/${file}`);
for (const file of ['references.js', 'hairstyles.js', 'bound-libraries.js', 'bound-libraries.json', 'library-manifest.json']) await cp(`data/${file}`, `dist/data/${file}`);
console.log('Built static site in dist/. No credentials, design contracts or development files included.');

await cp('assets', 'dist/assets', { recursive: true });

await cp('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');

// Version URLs by actual content so a returning browser cannot mix deployments.
let html = await readFile('dist/index.html', 'utf8');
for (const file of ['styles.css', 'app.js', 'engine.js', 'library-binding.js', 'data/references.js', 'data/hairstyles.js', 'data/bound-libraries.js']) {
  const digest = createHash('sha256').update(await readFile(`dist/${file}`)).digest('hex').slice(0, 12);
  html = html.replaceAll(`"${file}"`, `"${file}?v=${digest}"`);
}
await writeFile('dist/index.html', html);
