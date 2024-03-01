import { select } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toHtml } from 'hast-util-to-html';

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

function findFilterById(componentFilters, id) {
  let filter = null;
  componentFilters.forEach((item) => {
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

function extractProperties(node, id, componentModels) {
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
      properties[field.name] = encodeHtml(toHtml(select('div', children[idx]).children).trim());
    } else if (field?.component === 'image' || field?.component === 'reference') {
      properties[field.name] = select('img', children[idx])?.properties?.src;
    } else {
      properties[field.name] = toString(select('div', children[idx])).trim();
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
  const { pathMap, path } = ctx;
  const rows = node.children.filter((child) => child.type === 'element' && child.tagName === 'div');
  for (let i = 0; i < rows.length; i += 1) {
    const itemPath = `${path}/item${i + 1}`;
    pathMap.set(rows[i], itemPath);
    const properties = extractProperties(rows[i], filter, ctx.componentsModels);
    elements.push({
      type: 'element',
      name: `item${i + 1}`,
      attributes: {
        'jcr:primaryType': 'nt:unstructured',
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
  const { componentsModels, componentsDefinition, componentFilters } = ctx;
  if (!componentsModels || !componentsDefinition || !componentFilters) {
    console.warn('Block component not found');
    return {};
  }
  const { name, filterId } = findNameFilterById(componentsDefinition, id);
  const filter = findFilterById(componentFilters, filterId);
  const attributes = extractProperties(node, id, componentsModels);
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
  ctx.blockContext = ctx.path;
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
    && node.properties.className.length > 0
    && node.properties.className[0] !== 'columns';
}

const block = {
  use,
  getAttributes,
};

export default block;
