function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function insertComponent(obj, path, nodeName, component) {
  const keys = path.split('/');

  const isMatchingPath = (currentKeys, targetKeys) => (
    currentKeys.length === targetKeys.length
      && currentKeys.every((key, index) => key === targetKeys[index])
  );

  const insert = (parentObj, currentPath) => {
    const newPath = currentPath ? `${currentPath}/${parentObj.name}` : `/${parentObj.name}`;
    const children = parentObj.elements || [];
    // eslint-disable-next-line no-restricted-syntax
    for (const child of children) {
      if (isMatchingPath([
        ...newPath.split('/'),
        child.name,
      ], keys)) {
        const elements = child.elements || [];
        const { rt, nt, ...rest } = component;
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
          },
        ];
        return;
      }
      insert(child, newPath);
    }
  };

  insert(obj, '');
}

export function getHandler(node, parents, ctx) {
  const { handlers } = ctx;
  if (node.tagName === 'div' && parents[parents.length - 1]?.tagName === 'main') {
    return handlers.section;
  }
  if (node.tagName === 'div' && getHandler(parents[parents.length - 1], parents.slice(0, -2), ctx)?.name === 'section') {
    return handlers.block;
  }
  if (node.tagName === 'p') {
    return handlers.text;
  }
  return undefined;
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
      obj[component].counter = (hasOwnProperty(obj[component], 'counter') ? obj[component].counter + 1 : 0);
      return obj[component].counter;
    }

    return updateNestedTree(tree, path);
  };
}
