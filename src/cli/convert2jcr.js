/* eslint-disable no-await-in-loop,no-console */
import {
  readdir, readFile, stat, writeFile, mkdir,
} from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { html2jcr } from '../index.js';

async function run(filePath) {
  // eslint-disable-next-line no-param-reassign
  filePath = path.resolve(process.cwd(), filePath);
  const files = [];
  if ((await stat(filePath)).isDirectory()) {
    files.push(...await readdir(filePath));
  } else {
    files.push(filePath);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    if (!file.endsWith('.html')) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const dir = path.dirname(file);
    const base = path.basename(file, '.html');
    const targetPath = path.resolve(dir, base);
    if (!existsSync(targetPath)) {
      await mkdir(targetPath, { recursive: true });
    }

    const fileXml = path.resolve(targetPath, '.content.xml');

    console.log(`converting ${file} -> ${path.relative(process.cwd(), fileXml)}`);

    const html = await readFile(file);
    const buffer = await html2jcr(html);
    await writeFile(fileXml, buffer);
  }
}

run(process.argv[2] || process.cwd()).catch(console.error);
