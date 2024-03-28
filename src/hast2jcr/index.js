import { visitParents } from 'unist-util-visit-parents';
import convert from 'xml-js';
import skeleton from './skeleton.js';
import {
  createComponentTree, getHandler, findMatchingPath, insertComponent,
} from './utils.js';
import handlers from './handlers/index.js';

function buildPath(parents, { pathMap, handler }) {
  const path = '/jcr:root/jcr:content/root';
  if (handler.name !== 'section') {
    for (let i = parents.length - 1; i >= 0; i -= 1) {
      const currentNode = parents[i];
      if (pathMap.has(currentNode)) {
        for (let j = currentNode.children.length - 1; j >= 0; j -= 1) {
          const childNode = currentNode.children[j];
          if (childNode.tagName === 'hr' && pathMap.has(childNode)) {
            return pathMap.get(childNode);
          }
        }
        return pathMap.get(currentNode);
      }
    }
  }
  return path;
}

function getNodeName(name, path, { componentTree }) {
  const index = componentTree(`${path}/${name}`);
  return (index === 0) ? name : `${name}_${index - 1}`;
}
export default async function hast2jcr(hast, opts = {}) {
  const json = JSON.parse(JSON.stringify(skeleton));
  const [jcrRoot] = json.elements;
  const componentTree = createComponentTree();

  const pathMap = new Map();
  const ctx = {
    handlers,
    json,
    componentTree,
    pathMap,
    ...opts,
  };

  visitParents(hast, 'element', (node, parents) => {
    const handler = getHandler(node, parents, ctx);
    if (handler) {
      const path = buildPath(parents, {
        handler,
        ...ctx,
      });
      const nodeName = getNodeName(handler.name, path, ctx);
      const { getAttributes, insert: insertFunc } = handler;
      const attributes = getAttributes(node, {
        path: `${path}/${nodeName}`,
        parents,
        ...ctx,
      });

      const parentComponent = findMatchingPath(jcrRoot, path);

      if (insertFunc) {
        insertFunc(parentComponent, nodeName, attributes, ctx);
      } else {
        insertComponent(parentComponent, nodeName, attributes);
      }
      if (handler.name === 'block') {
        return 'skip';
      }

      pathMap.set(node, `${path}/${nodeName}`);
    }
    return 'continue';
  });

  const options = {
    compact: false,
    ignoreComment: true,
    spaces: 4,
  };

  return convert.json2xml(json, options);
}
