import { select, selectAll } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toHtml } from 'hast-util-to-html';
import button, { getType } from './button.js';

function findNameFilterById(componentDefinition, id) {
  let name = null;
  let filterId = null;
  componentDefinition.groups.forEach((group) => {
    group.components.forEach((component) => {
      if (component.id === id) {
        name = component.plugins.xwalk.page.template.name;
        filterId = component.plugins.xwalk.page.template.filter;
      }
    });
  });
  return { name, filterId };
}

function findFilterById(filters, id) {
  let filter = null;
  filters.forEach((item) => {
    if (item.id === id) {
      if (item?.components?.length > 0) {
        filter = item?.components[0];
      }
    }
  });
  return filter;
}

function findFieldsById(componentModels, id) {
  let fields = null;
  componentModels.forEach((item) => {
    if (item.id === id) {
      fields = item.fields;
    }
  });

  return fields;
}

function encodeHtml(str) {
  return str.replace(/</g, '&lt;')
    .replace(/(\r\n|\n|\r)/gm, '')
    .replace(/>[\s]*&lt;/g, '>&lt;');
}

function collapseField(id, fields, properties, node) {
  const suffixes = ['Alt', 'Type', 'MimeType', 'Text', 'Title'];
  suffixes.forEach((suffix) => {
    const field = fields.find((f) => f.name === `${id}${suffix}`);
    if (field) {
      if (suffix === 'Type') {
        if (node?.tagName.startsWith('h')) {
          properties[field.name] = node?.tagName?.toLowerCase();
        } else if (button.use(node)) {
          properties[field.name] = getType(node);
        }
      } else if (button.use(node)) {
        if (suffix === 'Text') {
          properties[field.name] = select('a', node)?.children?.[0]?.value;
        } else {
          properties[field.name] = select('a', node)?.properties?.[suffix.toLowerCase()];
        }
      } else {
        properties[field.name] = node?.properties?.[suffix.toLowerCase()];
      }
      fields.filter((value, index, array) => {
        if (value.name === `${id}${suffix}`) {
          array.splice(index, 1);
          return true;
        }
        return false;
      });
    }
  });
}

function extractProperties(node, id, componentModels, mode = 'container') {
  const children = node.children.filter((child) => child.type === 'element');
  const properties = {};
  const fields = findFieldsById(componentModels, id);
  if (!fields) {
    return properties;
  }
  fields.forEach((field, idx) => {
    if (children.length <= idx) {
      return;
    }
    if (field.name === 'classes') {
      const classNames = node?.properties?.className;
      if (classNames?.length > 1) {
        properties[field.name] = `[${classNames.slice(1).join(', ')}]`;
      }
    } else if (field?.component === 'richtext') {
      const selector = mode === 'container' ? 'div > *' : 'div > div > * ';
      properties[field.name] = encodeHtml(toHtml(selectAll(selector, children[idx])).trim());
    } else if (field?.component === 'image' || field?.component === 'reference') {
      const imageNode = select('img', children[idx]);
      if (imageNode) {
        properties[field.name] = select('img', children[idx])?.properties?.src;
        collapseField(field.name, fields, properties, imageNode);
      } else if (button.use(select('p', children[idx]))) {
        properties[field.name] = select('a', children[idx])?.properties?.href;
        collapseField(field.name, fields, properties, select('p', children[idx]));
      }
    } else {
      const headlineNode = select('h1, h2, h3, h4, h5, h6', children[idx]);
      if (headlineNode) {
        properties[field.name] = toString(select(headlineNode.tagName, children[idx])).trim();
        collapseField(field.name, fields, properties, headlineNode);
      } else {
        properties[field.name] = toString(select('div', children[idx])).trim();
      }
    }
  });
  properties.model = id;
  return properties;
}

function getBlockItems(node, filter, ctx) {
  if (!filter) {
    return undefined;
  }
  const elements = [];
  const { pathMap, path, componentDefinition } = ctx;
  const { name } = findNameFilterById(componentDefinition, filter);
  const rows = node.children.filter((child) => child.type === 'element' && child.tagName === 'div');
  for (let i = 0; i < rows.length; i += 1) {
    const itemPath = `${path}/item${i + 1}`;
    pathMap.set(rows[i], itemPath);
    const properties = extractProperties(rows[i], filter, ctx.componentModels);
    elements.push({
      type: 'element',
      name: i > 0 ? `item_${i - 1}` : 'item',
      attributes: {
        'jcr:primaryType': 'nt:unstructured',
        name,
        ...properties,
      },
    });
  }
  return elements;
}

function generateProperties(node, ctx) {
  const id = node?.properties?.className[0] || undefined;
  if (!id) {
    console.warn('Block component not found');
    return {};
  }
  const { componentModels, componentDefinition, filters } = ctx;
  if (!componentModels || !componentDefinition || !filters) {
    console.warn('Block component not found');
    return {};
  }
  const { name, filterId } = findNameFilterById(componentDefinition, id);
  const filter = findFilterById(filters, filterId);
  const attributes = extractProperties(node, id, componentModels, 'simple');
  const blockItems = getBlockItems(node, filter, ctx);
  const properties = {
    name,
    filter,
    ...attributes,
  };

  return { properties, children: blockItems };
}

function getAttributes(node, ctx) {
  const { properties, children } = generateProperties(node, ctx);
  return {
    rt: 'core/franklin/components/block/v1/block',
    children,
    ...properties,
  };
}

function use(node, parents) {
  return node.tagName === 'div'
    && parents.length > 2
    && parents[parents.length - 2].tagName === 'main'
    && node.properties?.className?.length > 0
    && node.properties?.className[0] !== 'columns'
    && node.properties?.className[0] !== 'section-metadata';
}

const block = {
  use,
  getAttributes,
};

export default block;
