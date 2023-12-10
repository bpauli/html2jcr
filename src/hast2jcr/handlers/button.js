import { h } from 'hastscript';
import { select } from 'unist-util-select';
import { matchStructure } from '../utils.js';

function getType(node) {
  if (matchStructure(node, h('p', [h('strong', [h('a')])]))) {
    return 'primary';
  }
  if (matchStructure(node, h('p', [h('em', [h('a')])]))) {
    return 'secondary';
  }
  return undefined;
}

function getLink(node) {
  const link = select('element[tagName=a]', node);
  const { href } = link.properties;
  const text = select('text', link).value;
  return { href, text };
}

export default function button(node) {
  const type = getType(node);
  const { href, text } = getLink(node);
  return {
    rt: 'core/franklin/components/button/v1/button',
    type,
    href,
    text,
  };
}
