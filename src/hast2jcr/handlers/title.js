import { encodeHTMLEntities } from '../utils.js';

function getText(node) {
  return node.children.map((child) => child.value).join('');
}

const title = {
  use: (node) => node.tagName.match(/h[1-6]/),
  getAttributes: (node) => ({
    rt: 'core/franklin/components/title/v1/title',
    'jcr:title': encodeHTMLEntities(getText(node)),
    type: node.tagName,
  }),
};

export default title;
