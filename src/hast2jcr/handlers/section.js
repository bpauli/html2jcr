const resourceType = 'core/franklin/components/section/v1/section';

function createMetadata(node) {
  const data = {};
  const rows = node.children.filter((row) => row.tagName === 'div');
  // eslint-disable-next-line no-restricted-syntax
  for (const row of rows) {
    const columns = row.children.filter((column) => column.tagName === 'div');
    if (columns.length !== 2) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const key = columns[0]?.children[0]?.value;
    const value = columns[1]?.children[0]?.value;
    if (key && value) {
      data[key] = value;
    }
  }
  return data;
}

function getMetaData(node, parents) {
  const data = {};
  const parent = node.tagName === 'hr' ? parents[parents.length - 1] : node;
  let currentSectionNode = node.tagName === 'div' ? node : null;

  const result = parent.children.find((child) => {
    if (child.tagName === 'hr') {
      currentSectionNode = child;
    }
    if (child.properties?.className?.includes('section-metadata')) {
      return currentSectionNode === node;
    }
    return false;
  });

  return result ? createMetadata(result) : data;
}

const section = {
  use: (node, parents) => {
    if (node.tagName === 'div') {
      if (parents[parents.length - 1]?.tagName === 'main') {
        return true;
      }
    } else if (node.tagName === 'hr') {
      return true;
    }
    return false;
  },
  getAttributes: (node, ctx) => {
    const metaData = getMetaData(node, ctx.parents);
    return {
      rt: resourceType,
      ...metaData,
    };
  },
};

export default section;
