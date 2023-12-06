export function insertComponent(obj, path, nodeName, component) {
  const keys = path.split("/");

  const isMatchingPath = (currentKeys, targetKeys) => {
    return (
      currentKeys.length === targetKeys.length &&
      currentKeys.every((key, index) => key === targetKeys[index])
    );
  };

  const insert = (parentObj, currentPath) => {
    const newPath = currentPath
      ? `${currentPath}/${parentObj["name"]}`
      : `/${parentObj["name"]}`;
    const children = parentObj["elements"] || [];
    for (const child of children) {
      if (isMatchingPath([
          ...newPath.split("/"),
          child["name"],
      ], keys)) {
        const elements = child["elements"] || [];
        const { rt, nt, ...rest } = component;
        child["elements"] = [
          ...elements,
          {
            type: "element",
            name: nodeName,
            attributes: {
              "sling:resourceType": rt,
              "jcr:primaryType": nt || "nt:unstructured",
              ...rest,
            },
          }
        ];
        return;
      }
      insert(child, newPath);
    }
  };

  insert(obj, "");
}

export function getHandler(node, parents, ctx) {
  const { handlers } = ctx;
  if (node.tagName === "div" && parents[parents.length - 1]?.tagName === "main") {
    return handlers["section"];
  } else if (node.tagName === "div" && getHandler(parents[parents.length -1], parents.slice(0, -2), ctx)?.name === "section") {
    return handlers["block"];
  }
  return undefined;
}

export function createComponentTree() {
  const tree = {};

  return function updateTree(treePath) {
    const path = treePath.split("/");

    function updateNestedTree(obj, path) {
      const component = path[0];
      if (!obj[component]) {
        obj[component] = {};
      }

      if (path.length > 1) {
        return updateNestedTree(obj[component], path.slice(1));
      } else {
        obj[component].counter = (obj[component].hasOwnProperty('counter') ? obj[component].counter + 1 : 0);
        return obj[component].counter;
      }
    }

    return updateNestedTree(tree, path);
  };
}
