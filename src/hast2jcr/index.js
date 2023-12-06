import { inspect } from "unist-util-inspect";
import { visitParents } from "unist-util-visit-parents";
import skeleton from "./skeleton.js";
import convert from "xml-js";
import { createComponentTree, getHandler, insertComponent } from "./utils.js";
import handlers from "./handlers/index.js";

export default async function hast2jcr(hast, opts = {}) {
  const json = {
    ...skeleton,
  };
  const componentTree = createComponentTree();

  const ctx = {
    handlers,
    json,
    componentTree,
  };

  const pathMap = new Map();

  visitParents(hast, 'element', function (node, parents) {
    const handler = getHandler(node, parents, ctx);
    if (handler) {
      const attributes = handler(node, ctx);
      const path = parents.map((parent) => pathMap.get(parent)).filter((path) => path !== undefined).join("/") ||
        "/jcr:root/jcr:content/root";
      const index = componentTree(`${path}/${handler.name}`);
      insertComponent(json.elements[0], path, `${handler.name}_${index}`, attributes);
      pathMap.set(node, `${path}/${handler.name}_${index}`);
    }
  });

  var options = {
    compact: false,
    ignoreComment: true,
    spaces: 4,
  };
  return convert.json2xml(json, options);
}
