import { h } from 'hastscript';
import { matches } from 'hast-util-select';

export function matchStructure(node, template) {
  if (node.tagName !== template.tagName) {
    return false;
  }
  const childElements = node.children.filter((child) => child.type !== 'text' || child.value.trim() !== '');
  if (childElements.length !== template.children.length) {
    return false;
  }
  if (childElements === 0) {
    return true;
  }
  return childElements.every((child, index) => matchStructure(child, template.children[index]));
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function insertComponent(obj, path, nodeName, component) {
  const keys = path.split('/');

  const isMatchingPath = (currentKeys, targetKeys) => currentKeys.length === targetKeys.length
    && currentKeys.every((key, index) => key === targetKeys[index]);

  const insert = (parentObj, currentPath) => {
    const newPath = currentPath ? `${currentPath}/${parentObj.name}` : `/${parentObj.name}`;
    const childrenObj = parentObj.elements || [];
    // eslint-disable-next-line no-restricted-syntax
    for (const child of childrenObj) {
      if (isMatchingPath([...newPath.split('/'), child.name], keys)) {
        const elements = child.elements || [];
        const {
          rt, nt, children, ...rest
        } = component;
        child.elements = [
          ...elements,
          {
            type: 'element',
            name: nodeName,
            attributes: {
              'sling:resourceType': rt,
              'jcr:primaryType': nt || 'nt:unstructured',
              ...rest,
            },
            ...(children !== undefined ? { elements: children } : {}),
          },
        ];
        return;
      }
      insert(child, newPath);
    }
  };

  insert(obj, '');
}

function isSection(node, parents) {
  return node.tagName === 'div' && parents.length > 1 && parents[parents.length - 1].tagName === 'main';
}

function isColumns(node, parents) {
  return node.tagName === 'div'
    && parents.length > 2
    && parents[parents.length - 2].tagName === 'main'
    && node.properties.className.length > 0
    && node.properties.className[0] === 'columns';
}

function isBlock(node, parents) {
  return node.tagName === 'div'
    && parents.length > 2
    && parents[parents.length - 2].tagName === 'main'
    && node.properties.className.length > 0
    && node.properties.className[0] !== 'columns';
}

function isButton(node, parents) {
  for (let i = parents.length - 1; i >= 0; i -= 1) {
    if (isBlock(parents[i], parents.slice(0, i))) {
      return false;
    }
  }
  return node.tagName === 'p'
    && (matchStructure(node, h('p', [h('strong', [h('a')])]))
        || matchStructure(node, h('p', [h('a')]))
        || matchStructure(node, h('p', [h('em', [h('a')])])));
}

function isImage(node, parents) {
  for (let i = parents.length - 1; i >= 0; i -= 1) {
    if (isBlock(parents[i], parents.slice(0, i))) {
      return false;
    }
  }
  return node.tagName === 'p'
    && (matchStructure(node, h('p', [h('img')]))
        || matchStructure(node, h('p', [h('picture', [h('img')])])));
}

function isText(node, parents) {
  for (let i = parents.length - 1; i >= 0; i -= 1) {
    if (isBlock(parents[i], parents.slice(0, i))) {
      return false;
    }
  }
  return node.tagName === 'p';
}

function isHeadline(node, parents) {
  for (let i = parents.length - 1; i >= 0; i -= 1) {
    if (isBlock(parents[i], parents.slice(0, i))) {
      return false;
    }
  }
  return matches('h1, h2, h3, h4, h5, h6', node);
}

export function getHandler(node, parents, ctx) {
  const { handlers } = ctx;
  let handler = null;
  if (isSection(node, parents)) {
    handler = handlers.section;
  } else if (isColumns(node, parents)) {
    handler = handlers.columns;
  } else if (isBlock(node, parents)) {
    handler = handlers.block;
  } else if (isButton(node, parents)) {
    handler = handlers.button;
  } else if (isImage(node, parents)) {
    handler = handlers.image;
  } else if (isText(node, parents)) {
    handler = handlers.text;
  } else if (isHeadline(node, parents)) {
    handler = handlers.title;
  }
  return handler;
}

export function createComponentTree() {
  const tree = {};

  return function updateTree(treePath) {
    const path = treePath.split('/');

    function updateNestedTree(obj, props) {
      const component = props[0];
      if (!obj[component]) {
        obj[component] = {};
      }

      if (props.length > 1) {
        return updateNestedTree(obj[component], props.slice(1));
      }
      obj[component].counter = hasOwnProperty(obj[component], 'counter')
        ? obj[component].counter + 1
        : 0;
      return obj[component].counter;
    }

    return updateNestedTree(tree, path);
  };
}
