import { mkdir, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/data', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'engine.js', 'favicon.svg', 'library-binding.js']) await cp(file, `dist/${file}`);
for (const file of ['references.js', 'hairstyles.js', 'bound-libraries.js', 'bound-libraries.json', 'library-manifest.json']) await cp(`data/${file}`, `dist/data/${file}`);
console.log('Built static site in dist/. No credentials, design contracts or development files included.');

await cp('assets', 'dist/assets', { recursive: true });

await cp('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
