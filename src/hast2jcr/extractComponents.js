import { select } from 'unist-util-select';

export default function extractComponents() {
  return function transform(tree, json) {
    const title = getValue(tree, 'title');
    json.
  }

  function getValue(tree, selector) {
    const node = select(selector, tree);
    if (node && node.children && node.children.length > 0) {
      return node.children[0].value;
    }
    return null;
  }
}