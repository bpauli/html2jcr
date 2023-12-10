import { toHtml } from 'hast-util-to-html';
import { getHandler } from '../utils.js';

function encodeHTMLEntities(str) {
  return str.replace(/</g, '&lt;');
}

function getText(nodes) {
  const html = nodes.map((node) => toHtml(node)).join('');
  return encodeHTMLEntities(html).trim();
}

function getParentNode(pathMap, path) {
  const parentPath = path.substring(0, path.lastIndexOf('/'));
  /* eslint-disable-next-line no-restricted-syntax */
  for (const [key, value] of pathMap.entries()) {
    if (value === parentPath) {
      return key;
    }
  }
  return undefined;
}

function getFollowingTextNodes(node, crx) {
  const { pathMap, path } = crx;
  const followingTextNodes = [];
  const parentNode = getParentNode(pathMap, path);
  if (parentNode) {
    const index = parentNode.children.indexOf(node);
    const followingNodes = parentNode.children.slice(index + 1);
    /* eslint-disable-next-line no-restricted-syntax */
    for (const followingNode of followingNodes) {
      const handler = getHandler(followingNode, [], crx);
      if (handler) {
        if (handler.name === 'text') {
          followingTextNodes.push(followingNode);
          pathMap.set(followingNode, path);
        } else {
          break;
        }
      }
    }
  }
  return followingTextNodes;
}

export default function text(node, crx) {
  const followingTextNodes = getFollowingTextNodes(node, crx);
  return {
    rt: 'core/franklin/components/text/v1/text',
    text: getText([node, ...followingTextNodes]),
  };
}
