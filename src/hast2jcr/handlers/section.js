import { select } from 'hast-util-select';

const resourceType = 'core/franklin/components/section/v1/section';

function getMetaData(node) {
  const data = {};
  const metaData = select('div.section-metadata', node);
  if (metaData) {
    const rows = metaData.children.filter((row) => row.tagName === 'div');
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
  }
  return data;
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
  getAttributes: (node) => {
    const metaData = getMetaData(node);
    return {
      rt: resourceType,
      ...metaData,
    };
  },
};

export default section;
