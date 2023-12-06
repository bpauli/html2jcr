import rehypeParse from 'rehype-parse'
import { unified } from 'unified';
import { hast2jcr } from '../index.js';

export default async function html2jcr(html, opts) {
  const hast = unified()
    .use(rehypeParse)
    .parse(html);

  return hast2jcr(hast, opts);
}
