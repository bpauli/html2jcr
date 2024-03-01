import { select } from 'unist-util-select';
import { h } from 'hastscript';
import { encodeHTMLEntities, hasSingleChildElement, matchStructure } from '../utils.js';

const resourceType = 'core/franklin/components/image/v1/image';

function getImage(node) {
  const $image = select('element[tagName=img]', node);
  const { alt, src } = $image.properties;
  return {
    alt: encodeHTMLEntities(alt),
    src: encodeHTMLEntities(src),
  };
}

const image = {
  use: (node) => {
    if (node.tagName === 'p') {
      if (hasSingleChildElement(node)) {
        if (matchStructure(node, h('p', [h('picture', [h('img')])]))
          || matchStructure(node, h('p', [h('img')]))) {
          return true;
        }
      }
    }
    return false;
  },
  getAttributes: (node) => {
    const { alt, src: fileReference } = getImage(node);
    return {
      rt: resourceType,
      alt,
      fileReference,
    };
  },
};

export default image;
