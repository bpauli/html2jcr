import { h } from 'hastscript';
import { matchStructure, hasSingleChildElement } from '../utils.js';

const resourceType = 'core/franklin/components/button/v1/button';

function getType(node) {
  if (matchStructure(node, h('p', [h('strong', [h('a')])]))) {
    return 'primary';
  }
  if (matchStructure(node, h('p', [h('em', [h('a')])]))) {
    return 'secondary';
  }
  return undefined;
}

function removeExtension(href) {
  if (href.startsWith('/')) {
    return href.replace(/\.[^/.]+$/, '');
  }
  return href;
}

function getLink(node) {
  const [buttonNode] = node.children;
  if (!buttonNode || !buttonNode.properties) {
    return { href: '', text: '', title: '' };
  }
  if (getType(node)) {
    const { href, title } = buttonNode.children[0].properties;
    const text = buttonNode.children[0].children[0].value;
    return { href: removeExtension(href), text, title };
  }
  const { href, title } = buttonNode.properties;
  const text = buttonNode.children[0].value;
  return { href: removeExtension(href), text, title };
}

const button = {
  use: (node) => {
    if (node.tagName === 'p') {
      if (hasSingleChildElement(node)) {
        if (matchStructure(node, h('p', [h('strong', [h('a')])]))
          || matchStructure(node, h('p', [h('a')]))
          || matchStructure(node, h('p', [h('em', [h('a')])]))) {
          return true;
        }
      }
    }
    return false;
  },
  getAttributes: (node) => {
    const type = getType(node);
    const { href, text, title } = getLink(node);
    return {
      rt: resourceType,
      type,
      href,
      text,
      title,
    };
  },
};

export default button;
