import path from 'path';
import fs from 'node:fs/promises';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { html2jcr } from '../src/index.js';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsModels = await fs.readFile(path.resolve(__dirname, 'fixtures', 'components-models.json'), 'utf-8');
const componentsDefinition = await fs.readFile(path.resolve(__dirname, 'fixtures', 'components-definition.json'), 'utf-8');
const componentFilters = await fs.readFile(path.resolve(__dirname, 'fixtures', 'component-filters.json'), 'utf-8');

async function test(spec) {
  const html = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.html`), 'utf-8');
  let xmlExpected = html;
  try {
    xmlExpected = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.expected.xml`), 'utf-8');
  } catch (e) {
    // ignore
  }
  const actual = await html2jcr(html, {
    componentsModels: JSON.parse(componentsModels),
    componentsDefinition: JSON.parse(componentsDefinition),
    componentFilters: JSON.parse(componentFilters),
  });
  assert.strictEqual(actual, xmlExpected);
}

describe('HTML to JCR converter', () => {
  it('converts a simple default content text', async () => {
    await test('text-simple');
  });

  it('converts a default content text with siblings', async () => {
    await test('text-siblings');
  });

  it('converts a default content image', async () => {
    await test('image');
  });

  it('converts a default content headlines', async () => {
    await test('headline');
  });

  it('converts a column block', async () => {
    await test('columns');
  });

  it('converts a generic block', async () => {
    await test('block');
  });
});
