import rehypeParse from 'rehype-parse';
import { raw } from 'hast-util-raw';
import { unified } from 'unified';
import { toHast as mdast2hast, defaultHandlers } from 'mdast-util-to-hast';
import remarkGridTable from '@adobe/remark-gridtables';
import { mdast2hastGridTablesHandler, TYPE_TABLE } from '@adobe/mdast-util-gridtables';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import rehypeFormat from 'rehype-format';
import createPageBlocks from '@adobe/helix-html-pipeline/src/steps/create-page-blocks.js';
import { h } from 'hastscript';
import fixSections from '@adobe/helix-html-pipeline/src/steps/fix-sections.js';
import hast2jcr from '../hast2jcr/index.js';

async function html2jcr(html, opts) {
  const hast = unified()
    .use(rehypeParse)
    .parse(html);

  return hast2jcr(hast, opts);
}

async function md2jcr(md, opts) {
  const mdast = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGridTable)
    .parse(md);

  const main = mdast2hast(mdast, {
    handlers: {
      ...defaultHandlers,
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
    allowDangerousHtml: true,
  });

  const content = { hast: main };

  fixSections({ content });
  createPageBlocks({ content });

  const doc = h('html', [
    h('body', [
      h('header', []),
      h('main', content.hast),
      h('footer', [])]),
  ]);

  raw(doc);
  rehypeFormat()(doc);
  return hast2jcr(doc, opts);
}

export {
  html2jcr,
  md2jcr,
};
