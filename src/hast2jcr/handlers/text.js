import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';
import {
  hasSingleChildElement, encodeHTMLEntities, insertComponent, matchStructure,
} from '../utils.js';

const resourceType = 'core/franklin/components/text/v1/text';

function isCollapsible(element) {
  const { attributes = {} } = element;
  return attributes['sling:resourceType'] === resourceType;
}

function getRichText(node) {
  const richText = toHtml(node);
  return encodeHTMLEntities(richText);
}

const text = {
  use: (node) => {
    // Ignore paragraphs that only contain a single button or single image
    if (node.tagName === 'p') {
      if (hasSingleChildElement(node)) {
        if (matchStructure(node, h('p', [h('strong', [h('a')])]))
          || matchStructure(node, h('p', [h('a')]))
          || matchStructure(node, h('p', [h('em', [h('a')])]))) {
          return false;
        }
        if (matchStructure(node, h('p', [h('picture', [h('img')])]))
          || matchStructure(node, h('p', [h('img')]))) {
          return false;
        }
      }
      return true;
    }
    return false;
  },
  getAttributes: (node) => ({
    rt: resourceType,
    text: getRichText(node),
  }),
  insert: (parent, nodeName, component) => {
    const elements = parent.elements || [];
    const previousSibling = elements.at(-1);
    if (previousSibling && isCollapsible(previousSibling)) {
      previousSibling.attributes.text += component.text;
    } else {
      insertComponent(parent, nodeName, component);
    }
  },
};

export default text;
