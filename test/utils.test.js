import { h } from 'hastscript';
import assert from 'assert';
import { insertComponent, createComponentTree, matchStructure, findMatchingPath } from '../src/hast2jcr/utils.js';

describe('Utils', () => {
  it('Insert component at a path', async () => {
    const obj = {
      type: 'element',
      name: 'root',
      elements: [
        {
          type: 'element',
          name: 'jcr:content',
          attributes: {
            'jcr:primaryType': 'nt:unstructured',
          },
          elements: [
            {
              type: 'element',
              name: 'text',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': 'text',
              },
            },
          ],
        },
      ],
    };
    const path = '/root/jcr:content';
    const nodeName = 'image';
    const component = {
      rt: '/apps/image',
    };
    const parentComponent = findMatchingPath(obj, path);
    insertComponent(parentComponent, nodeName, component);
    const expected = {
      type: 'element',
      name: 'root',
      elements: [
        {
          type: 'element',
          name: 'jcr:content',
          attributes: {
            'jcr:primaryType': 'nt:unstructured',
          },
          elements: [
            {
              type: 'element',
              name: 'text',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': 'text',
              },
            },
            {
              type: 'element',
              name: 'image',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': '/apps/image',
              },
            },
          ],
        },
      ],
    };
    assert.deepStrictEqual(obj, expected);
  });

  it('test create tree', async () => {
    const tree = createComponentTree();
    assert.deepStrictEqual(tree('a/b/c'), 0);
    assert.deepStrictEqual(tree('a/b/c'), 1);
  });

  it('match structure', async () => {
    assert.equal(
      matchStructure(h('p', [h('a')]), h('p', [h('a')])),
      true,
    );
  });
});
