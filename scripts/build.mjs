import { mkdir, copyFile, rm } from 'node:fs/promises';
import { build } from 'esbuild';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css']) await copyFile(file, `dist/${file}`);
await build({ entryPoints: ['app.js'], outfile: 'dist/app.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
