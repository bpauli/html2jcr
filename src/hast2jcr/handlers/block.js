import { select } from 'hast-util-select';
import { toString } from 'hast-util-to-string';

function findNameById(componentDefinition, id) {
  let name = null;
  componentDefinition.groups.forEach((group) => {
    group.components.forEach((component) => {
      if (component.id === id) {
        name = component.plugins.xwalk.page.template.name;
      }
    });
  });
  return name;
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

function extractProperties(node, id, componentModels) {
  const properties = {};
  const fields = findFieldsById(componentModels, id);
  fields.forEach((field, idx) => {
    if (field?.component === 'text-input') {
      properties[field.name] = toString(select(`div > div :nth-child(${idx + 1})`, node)).trim();
    }
  });
  return properties;
}

function generateProperties(node, componentModels, componentDefinition) {
  const id = node?.properties?.className[0] || undefined;
  if (!id) {
    console.warn('Block component not found');
    return {};
  }
  const name = findNameById(componentDefinition, id);
  const properties = extractProperties(node, id, componentModels);
  const result = {
    model: id,
    name,
    ...properties,
  };

  return result;
}

export default function block(node, opts) {
  const { componentModels, componentDefinition } = opts;
  const properties = generateProperties(node, componentModels, componentDefinition);
  const attributes = {
    rt: 'core/franklin/components/block/v1/block',
    ...properties,
  };
  return attributes;
}